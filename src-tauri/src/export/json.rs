use crate::db::queries::HealthRecord;
use serde_json::{json, Value};

pub fn export_records_to_json(records: Vec<HealthRecord>) -> Result<String, String> {
    let now = chrono::Utc::now().to_rfc3339();

    let records_array: Vec<Value> = records
        .iter()
        .map(|record| {
            json!({
                "id": record.id,
                "date": record.date,
                "title": record.title,
                "notes_html": record.notes_html,
                "symptoms": record.symptoms,
                "medications": record.medications,
                "vitals": record.vitals,
                "sleep": record.sleep,
                "wellbeing": record.wellbeing,
                "created_at": record.created_at,
                "updated_at": record.updated_at,
            })
        })
        .collect();

    let export = json!({
        "metadata": {
            "app": "Bayand",
            "exportedAt": now,
            "version": env!("CARGO_PKG_VERSION"),
            "schemaVersion": 1,
        },
        "records": records_array,
    });

    serde_json::to_string_pretty(&export).map_err(|e| format!("Failed to serialize JSON: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_record(id: i64, date: &str, title: &str) -> HealthRecord {
        HealthRecord {
            id,
            date: date.to_string(),
            title: title.to_string(),
            notes_html: "<p>Body</p>".to_string(),
            created_at: "2024-01-01T12:00:00Z".to_string(),
            updated_at: "2024-01-01T12:00:00Z".to_string(),
            symptoms: vec![],
            medications: vec![],
            vitals: None,
            sleep: None,
            wellbeing: None,
        }
    }

    #[test]
    fn exports_expected_metadata() {
        let result = export_records_to_json(vec![]).unwrap();
        let parsed: Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["metadata"]["app"], "Bayand");
        assert_eq!(parsed["metadata"]["schemaVersion"], 1);
        assert!(parsed["records"].as_array().unwrap().is_empty());
    }

    #[test]
    fn exports_multiple_records() {
        let result = export_records_to_json(vec![
            create_test_record(1, "2024-01-01", "Morning"),
            create_test_record(2, "2024-01-01", "Evening"),
        ])
        .unwrap();
        let parsed: Value = serde_json::from_str(&result).unwrap();
        let records = parsed["records"].as_array().unwrap();
        assert_eq!(records.len(), 2);
        assert_eq!(records[0]["id"], 1);
        assert_eq!(records[1]["title"], "Evening");
    }
}
