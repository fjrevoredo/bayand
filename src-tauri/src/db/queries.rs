use crate::crypto::cipher;
use crate::db::schema::DatabaseConnection;
use rusqlite::params;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymptomLog {
    pub name: String,
    pub severity: Option<i64>,
    pub time: Option<String>,
    pub tags: Vec<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicationLog {
    pub name: String,
    pub dose: Option<f64>,
    pub unit: Option<String>,
    pub time: Option<String>,
    pub taken: bool,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Vitals {
    pub weight: Option<f64>,
    pub temperature: Option<f64>,
    pub heart_rate: Option<f64>,
    pub blood_pressure_systolic: Option<f64>,
    pub blood_pressure_diastolic: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SleepSummary {
    pub bedtime: Option<String>,
    pub wake_time: Option<String>,
    pub duration_minutes: Option<i64>,
    pub quality_score: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WellbeingSummary {
    pub mood_score: Option<i64>,
    pub energy_score: Option<i64>,
    pub stress_score: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthRecordPayload {
    pub title: String,
    pub notes_html: String,
    pub symptoms: Vec<SymptomLog>,
    pub medications: Vec<MedicationLog>,
    pub vitals: Option<Vitals>,
    pub sleep: Option<SleepSummary>,
    pub wellbeing: Option<WellbeingSummary>,
}

impl Default for HealthRecordPayload {
    fn default() -> Self {
        Self {
            title: String::new(),
            notes_html: String::new(),
            symptoms: vec![],
            medications: vec![],
            vitals: None,
            sleep: None,
            wellbeing: None,
        }
    }
}

impl HealthRecordPayload {
    pub fn is_effectively_empty(&self) -> bool {
        self.title.trim().is_empty()
            && html_is_empty(&self.notes_html)
            && self.symptoms.is_empty()
            && self.medications.is_empty()
            && self.vitals.as_ref().is_none_or(|v| {
                v.weight.is_none()
                    && v.temperature.is_none()
                    && v.heart_rate.is_none()
                    && v.blood_pressure_systolic.is_none()
                    && v.blood_pressure_diastolic.is_none()
            })
            && self.sleep.as_ref().is_none_or(|s| {
                s.bedtime.is_none()
                    && s.wake_time.is_none()
                    && s.duration_minutes.is_none()
                    && s.quality_score.is_none()
            })
            && self.wellbeing.as_ref().is_none_or(|w| {
                w.mood_score.is_none() && w.energy_score.is_none() && w.stress_score.is_none()
            })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthRecord {
    pub id: i64,
    pub date: String,
    pub title: String,
    pub notes_html: String,
    pub created_at: String,
    pub updated_at: String,
    pub symptoms: Vec<SymptomLog>,
    pub medications: Vec<MedicationLog>,
    pub vitals: Option<Vitals>,
    pub sleep: Option<SleepSummary>,
    pub wellbeing: Option<WellbeingSummary>,
}

impl HealthRecord {
    pub fn payload(&self) -> HealthRecordPayload {
        HealthRecordPayload {
            title: self.title.clone(),
            notes_html: self.notes_html.clone(),
            symptoms: self.symptoms.clone(),
            medications: self.medications.clone(),
            vitals: self.vitals.clone(),
            sleep: self.sleep.clone(),
            wellbeing: self.wellbeing.clone(),
        }
    }
}

pub fn insert_record(
    db: &DatabaseConnection,
    date: &str,
    payload: &HealthRecordPayload,
) -> Result<HealthRecord, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let encrypted = encrypt_payload(db, payload)?;

    db.conn()
        .execute(
            "INSERT INTO records (date, payload, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
            params![date, encrypted, now],
        )
        .map_err(|e| format!("Failed to insert record: {}", e))?;

    let id = db.conn().last_insert_rowid();
    get_record_by_id(db, id)?.ok_or_else(|| "Failed to fetch inserted record".to_string())
}

pub fn get_record_by_id(db: &DatabaseConnection, id: i64) -> Result<Option<HealthRecord>, String> {
    let result = db.conn().query_row(
        "SELECT id, date, payload, created_at, updated_at FROM records WHERE id = ?1",
        params![id],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Vec<u8>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        },
    );

    match result {
        Ok((id, date, payload, created_at, updated_at)) => Ok(Some(decode_record(
            db,
            id,
            date,
            payload,
            created_at,
            updated_at,
        )?)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

pub fn get_records_by_date(db: &DatabaseConnection, date: &str) -> Result<Vec<HealthRecord>, String> {
    let mut stmt = db
        .conn()
        .prepare(
            "SELECT id, date, payload, created_at, updated_at
             FROM records
             WHERE date = ?1
             ORDER BY id DESC",
        )
        .map_err(|e| format!("Failed to prepare records query: {}", e))?;

    let rows = stmt
        .query_map(params![date], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Vec<u8>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|e| format!("Failed to query records: {}", e))?;

    rows.map(|row| {
        let (id, date, payload, created_at, updated_at) =
            row.map_err(|e| format!("Failed to read record row: {}", e))?;
        decode_record(db, id, date, payload, created_at, updated_at)
    })
    .collect()
}

pub fn update_record(
    db: &DatabaseConnection,
    id: i64,
    payload: &HealthRecordPayload,
) -> Result<HealthRecord, String> {
    let updated_at = chrono::Utc::now().to_rfc3339();
    let encrypted = encrypt_payload(db, payload)?;
    let rows = db
        .conn()
        .execute(
            "UPDATE records SET payload = ?1, updated_at = ?2 WHERE id = ?3",
            params![encrypted, updated_at, id],
        )
        .map_err(|e| format!("Failed to update record: {}", e))?;

    if rows == 0 {
        return Err(format!("No record found with id {}", id));
    }

    get_record_by_id(db, id)?.ok_or_else(|| format!("No record found with id {}", id))
}

pub fn delete_record_by_id(db: &DatabaseConnection, id: i64) -> Result<bool, String> {
    let rows = db
        .conn()
        .execute("DELETE FROM records WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete record: {}", e))?;
    Ok(rows > 0)
}

pub fn get_all_record_dates(db: &DatabaseConnection) -> Result<Vec<String>, String> {
    let mut stmt = db
        .conn()
        .prepare("SELECT DISTINCT date FROM records ORDER BY date ASC")
        .map_err(|e| format!("Failed to prepare dates query: {}", e))?;
    let dates = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| format!("Failed to query dates: {}", e))?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| format!("Failed to collect dates: {}", e))?;
    Ok(dates)
}

pub fn get_all_records(db: &DatabaseConnection) -> Result<Vec<HealthRecord>, String> {
    let mut stmt = db
        .conn()
        .prepare("SELECT id, date, payload, created_at, updated_at FROM records ORDER BY date ASC, id ASC")
        .map_err(|e| format!("Failed to prepare records query: {}", e))?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Vec<u8>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|e| format!("Failed to query records: {}", e))?;

    rows.map(|row| {
        let (id, date, payload, created_at, updated_at) =
            row.map_err(|e| format!("Failed to read record row: {}", e))?;
        decode_record(db, id, date, payload, created_at, updated_at)
    })
    .collect()
}

pub fn get_wrapped_key(db: &DatabaseConnection) -> Result<Vec<u8>, String> {
    db.conn()
        .query_row("SELECT wrapped_key FROM auth WHERE id = 1", [], |row| row.get(0))
        .map_err(|e| format!("Failed to load wrapped key: {}", e))
}

pub fn update_wrapped_key(db: &DatabaseConnection, wrapped_key: &[u8]) -> Result<(), String> {
    let updated_at = chrono::Utc::now().to_rfc3339();
    let rows = db
        .conn()
        .execute(
            "UPDATE auth SET wrapped_key = ?1, updated_at = ?2 WHERE id = 1",
            params![wrapped_key, updated_at],
        )
        .map_err(|e| format!("Failed to update auth key: {}", e))?;
    if rows == 0 {
        return Err("Auth row not found".to_string());
    }
    Ok(())
}

fn decode_record(
    db: &DatabaseConnection,
    id: i64,
    date: String,
    payload: Vec<u8>,
    created_at: String,
    updated_at: String,
) -> Result<HealthRecord, String> {
    let payload = decrypt_payload(db, &payload)?;
    Ok(HealthRecord {
        id,
        date,
        title: payload.title,
        notes_html: payload.notes_html,
        created_at,
        updated_at,
        symptoms: payload.symptoms,
        medications: payload.medications,
        vitals: payload.vitals,
        sleep: payload.sleep,
        wellbeing: payload.wellbeing,
    })
}

fn encrypt_payload(db: &DatabaseConnection, payload: &HealthRecordPayload) -> Result<Vec<u8>, String> {
    let bytes = serde_json::to_vec(payload).map_err(|e| format!("Failed to encode payload: {}", e))?;
    cipher::encrypt(db.key(), &bytes).map_err(|e| format!("Failed to encrypt payload: {}", e))
}

fn decrypt_payload(db: &DatabaseConnection, payload: &[u8]) -> Result<HealthRecordPayload, String> {
    let decrypted = cipher::decrypt(db.key(), payload)
        .map_err(|e| format!("Failed to decrypt payload: {}", e))?;
    serde_json::from_slice(&decrypted).map_err(|e| format!("Failed to decode payload: {}", e))
}

fn html_is_empty(html: &str) -> bool {
    let stripped = html
        .replace("<p></p>", "")
        .replace("<p><br></p>", "")
        .replace("<br>", "")
        .replace("&nbsp;", " ")
        .trim()
        .to_string();
    stripped.is_empty()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema::create_database;

    #[test]
    fn record_crud_roundtrip() {
        let tmp = tempfile::Builder::new().suffix(".db").tempfile().unwrap();
        let db = create_database(tmp.path(), "pw".to_string()).unwrap();

        let inserted = insert_record(
            &db,
            "2026-03-08",
            &HealthRecordPayload {
                title: "Morning".to_string(),
                notes_html: "<p>Fine</p>".to_string(),
                ..HealthRecordPayload::default()
            },
        )
        .unwrap();
        assert_eq!(inserted.title, "Morning");

        let by_date = get_records_by_date(&db, "2026-03-08").unwrap();
        assert_eq!(by_date.len(), 1);

        let updated = update_record(
            &db,
            inserted.id,
            &HealthRecordPayload {
                title: "Evening".to_string(),
                notes_html: "<p>Done</p>".to_string(),
                ..HealthRecordPayload::default()
            },
        )
        .unwrap();
        assert_eq!(updated.title, "Evening");

        let dates = get_all_record_dates(&db).unwrap();
        assert_eq!(dates, vec!["2026-03-08".to_string()]);

        assert!(delete_record_by_id(&db, inserted.id).unwrap());
        assert!(get_records_by_date(&db, "2026-03-08").unwrap().is_empty());
    }

    #[test]
    fn empty_payload_detection_matches_v1_rules() {
        assert!(HealthRecordPayload::default().is_effectively_empty());
    }
}
