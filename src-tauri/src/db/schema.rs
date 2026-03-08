use crate::crypto::cipher;
use rand::RngCore;
use rusqlite::Connection;
use std::path::Path;
use zeroize::Zeroize;

#[derive(Debug)]
pub struct DatabaseConnection {
    pub(crate) conn: Connection,
    pub(crate) encryption_key: cipher::Key,
}

impl DatabaseConnection {
    pub fn conn(&self) -> &Connection {
        &self.conn
    }

    pub fn key(&self) -> &cipher::Key {
        &self.encryption_key
    }
}

pub const SCHEMA_VERSION: i32 = 1;

pub fn create_database<P: AsRef<Path>>(
    db_path: P,
    password: String,
) -> Result<DatabaseConnection, String> {
    let mut master_key_bytes = [0u8; 32];
    aes_gcm::aead::OsRng.fill_bytes(&mut master_key_bytes);
    let encryption_key =
        cipher::Key::from_slice(&master_key_bytes).ok_or("Invalid master key size")?;

    let conn =
        Connection::open(&db_path).map_err(|e| format!("Failed to create database: {}", e))?;
    create_schema(&conn)?;

    let wrapped_key = crate::auth::password::PasswordMethod::new(password)
        .wrap_master_key(&master_key_bytes)
        .map_err(|e| format!("Failed to wrap master key: {}", e))?;
    master_key_bytes.zeroize();

    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO auth (id, wrapped_key, created_at, updated_at) VALUES (1, ?1, ?2, ?2)",
        rusqlite::params![wrapped_key, now],
    )
    .map_err(|e| format!("Failed to create auth row: {}", e))?;

    Ok(DatabaseConnection {
        conn,
        encryption_key,
    })
}

pub fn open_database<P1: AsRef<Path>, P2: AsRef<Path>>(
    db_path: P1,
    password: String,
    _backups_dir: P2,
) -> Result<DatabaseConnection, String> {
    let conn = Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))?;

    let version: i32 = conn
        .query_row("SELECT version FROM schema_version", [], |row| row.get(0))
        .map_err(|e| format!("Failed to read schema version: {}", e))?;

    if version != SCHEMA_VERSION {
        return Err(format!(
            "Unsupported Bayand schema version: {} (expected {})",
            version, SCHEMA_VERSION
        ));
    }

    let wrapped_key: Vec<u8> = conn
        .query_row("SELECT wrapped_key FROM auth WHERE id = 1", [], |row| row.get(0))
        .map_err(|e| format!("Failed to load wrapped key: {}", e))?;

    let master_key_bytes = crate::auth::password::PasswordMethod::new(password)
        .unwrap_master_key(&wrapped_key)
        .map_err(|_| "Incorrect password".to_string())?;
    let encryption_key =
        cipher::Key::from_slice(&master_key_bytes).ok_or("Invalid master key size")?;

    Ok(DatabaseConnection {
        conn,
        encryption_key,
    })
}

fn create_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS auth (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            wrapped_key BLOB NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            payload BLOB NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);

        DELETE FROM schema_version;
        INSERT INTO schema_version (version) VALUES (1);
        "#,
    )
    .map_err(|e| format!("Failed to create schema: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::queries::{get_all_record_dates, get_wrapped_key, insert_record, HealthRecordPayload};

    #[test]
    fn test_create_and_open_database() {
        let tmp = tempfile::Builder::new().suffix(".db").tempfile().unwrap();
        let db = create_database(tmp.path(), "password".to_string()).unwrap();
        let version: i32 = db
            .conn()
            .query_row("SELECT version FROM schema_version", [], |row| row.get(0))
            .unwrap();
        assert_eq!(version, SCHEMA_VERSION);
        assert!(!get_wrapped_key(&db).unwrap().is_empty());

        drop(db);

        let reopened = open_database(tmp.path(), "password".to_string(), ".").unwrap();
        let count: i64 = reopened
            .conn()
            .query_row("SELECT COUNT(*) FROM auth", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_open_database_wrong_password() {
        let tmp = tempfile::Builder::new().suffix(".db").tempfile().unwrap();
        create_database(tmp.path(), "password".to_string()).unwrap();
        let err = open_database(tmp.path(), "wrong".to_string(), ".").unwrap_err();
        assert_eq!(err, "Incorrect password");
    }

    #[test]
    fn test_plaintext_date_and_encrypted_payload() {
        let tmp = tempfile::Builder::new().suffix(".db").tempfile().unwrap();
        let db = create_database(tmp.path(), "password".to_string()).unwrap();

        insert_record(
            &db,
            "2026-03-08",
            &HealthRecordPayload {
                title: "Encrypted".to_string(),
                notes_html: "<p>secret</p>".to_string(),
                ..Default::default()
            },
        )
        .unwrap();

        let stored_date: String = db
            .conn()
            .query_row("SELECT date FROM records LIMIT 1", [], |row| row.get(0))
            .unwrap();
        let stored_payload: Vec<u8> = db
            .conn()
            .query_row("SELECT payload FROM records LIMIT 1", [], |row| row.get(0))
            .unwrap();

        assert_eq!(stored_date, "2026-03-08");
        assert!(!String::from_utf8_lossy(&stored_payload).contains("Encrypted"));
        assert_eq!(get_all_record_dates(&db).unwrap(), vec!["2026-03-08".to_string()]);
    }
}
