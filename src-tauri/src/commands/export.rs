use crate::commands::auth::BayandState;
use crate::db::queries::{self, HealthRecord};
use crate::db::schema::DatabaseConnection;
use crate::export::json;
use log::{debug, error, info};
use tauri::State;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExportResult {
    pub records_exported: usize,
    pub file_path: String,
}

pub(crate) fn fetch_all_records(db: &DatabaseConnection) -> Result<Vec<HealthRecord>, String> {
    queries::get_all_records(db)
}

#[tauri::command]
pub fn export_json(file_path: String, state: State<BayandState>) -> Result<ExportResult, String> {
    info!("Starting JSON export to file: {}", file_path);

    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state.as_ref().ok_or_else(|| {
        let err = "Tracker must be unlocked to export records";
        error!("{}", err);
        err.to_string()
    })?;

    let records = fetch_all_records(db)?;
    let records_exported = records.len();
    debug!("Serializing {} records to JSON...", records_exported);

    let json_string = json::export_records_to_json(records)?;

    std::fs::write(&file_path, &json_string).map_err(|e| {
        let err = format!("Failed to write file: {}", e);
        error!("{}", err);
        err
    })?;

    info!(
        "JSON export complete: {} records exported to {}",
        records_exported, file_path
    );
    Ok(ExportResult {
        records_exported,
        file_path,
    })
}

#[cfg(test)]
mod tests {
    use crate::db::schema::create_database;
    use std::fs;

    fn cleanup_files(paths: &[&str]) {
        for path in paths {
            let _ = fs::remove_file(path);
        }
    }

    #[test]
    fn test_export_json_writes_file() {
        let tmp = tempfile::Builder::new().suffix(".db").tempfile().unwrap();
        let export_path = "test_export_output.json";
        cleanup_files(&[export_path]);

        let db = create_database(tmp.path().to_str().unwrap(), "test".to_string()).unwrap();

        crate::db::queries::insert_record(
            &db,
            "2024-01-01",
            &crate::db::queries::HealthRecordPayload {
                title: "Entry 1".to_string(),
                notes_html: "<p>Content one</p>".to_string(),
                ..Default::default()
            },
        )
        .unwrap();
        crate::db::queries::insert_record(
            &db,
            "2024-01-02",
            &crate::db::queries::HealthRecordPayload {
                title: "Entry 2".to_string(),
                notes_html: "<p>Content two</p>".to_string(),
                ..Default::default()
            },
        )
        .unwrap();

        let records = crate::db::queries::get_all_records(&db).unwrap();
        let json_string = crate::export::json::export_records_to_json(records).unwrap();
        fs::write(export_path, &json_string).unwrap();

        let content = fs::read_to_string(export_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();

        let records_arr = parsed["records"].as_array().unwrap();
        assert_eq!(records_arr.len(), 2);
        let titles: Vec<&str> = records_arr
            .iter()
            .map(|e| e["title"].as_str().unwrap())
            .collect();
        assert!(titles.contains(&"Entry 1"));
        assert!(titles.contains(&"Entry 2"));

        cleanup_files(&[export_path]);
    }

    #[test]
    fn test_export_empty_tracker() {
        let tmp = tempfile::Builder::new().suffix(".db").tempfile().unwrap();
        let export_path = "test_export_empty_output.json";
        cleanup_files(&[export_path]);

        let db = create_database(tmp.path().to_str().unwrap(), "test".to_string()).unwrap();
        let records = crate::db::queries::get_all_records(&db).unwrap();
        let json_string = crate::export::json::export_records_to_json(records).unwrap();
        fs::write(export_path, &json_string).unwrap();

        let content = fs::read_to_string(export_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();
        assert_eq!(parsed["records"].as_array().unwrap().len(), 0);

        cleanup_files(&[export_path]);
    }
}
