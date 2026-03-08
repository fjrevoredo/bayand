use crate::commands::auth::BayandState;
use crate::db::queries::{self, HealthRecord, HealthRecordPayload};
use tauri::State;

#[tauri::command]
pub fn create_record(date: String, state: State<BayandState>) -> Result<HealthRecord, String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to create records")?;

    queries::insert_record(db, &date, &HealthRecordPayload::default())
}

#[tauri::command]
pub fn save_record(
    id: i64,
    payload: HealthRecordPayload,
    state: State<BayandState>,
) -> Result<HealthRecord, String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to save records")?;

    queries::update_record(db, id, &payload)
}

#[tauri::command]
pub fn get_records_for_date(
    date: String,
    state: State<BayandState>,
) -> Result<Vec<HealthRecord>, String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to read records")?;

    queries::get_records_by_date(db, &date)
}

#[tauri::command]
pub fn delete_record_if_empty(
    id: i64,
    payload: HealthRecordPayload,
    state: State<BayandState>,
) -> Result<bool, String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to delete records")?;

    if !payload.is_effectively_empty() {
        return Ok(false);
    }

    queries::delete_record_by_id(db, id)
}

#[tauri::command]
pub fn delete_record(id: i64, state: State<BayandState>) -> Result<(), String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to delete records")?;

    if queries::delete_record_by_id(db, id)? {
        Ok(())
    } else {
        Err("Record not found".to_string())
    }
}

#[tauri::command]
pub fn get_all_record_dates(state: State<BayandState>) -> Result<Vec<String>, String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to read dates")?;

    queries::get_all_record_dates(db)
}
