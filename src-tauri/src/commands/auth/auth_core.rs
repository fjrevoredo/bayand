use crate::db::schema::{create_database, open_database};
use log::{info, warn};
use tauri::{AppHandle, State, Wry};

use super::BayandState;

#[tauri::command]
pub fn create_tracker(
    password: String,
    state: State<BayandState>,
    app: AppHandle<Wry>,
) -> Result<(), String> {
    let db_path = state
        .db_path
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?
        .clone();

    if db_path.exists() {
        return Err("Tracker already exists".to_string());
    }

    let db_conn = create_database(&db_path, password)?;

    let mut db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    *db_state = Some(db_conn);

    info!("Tracker created");
    crate::menu::update_menu_lock_state(&app, false);
    Ok(())
}

#[tauri::command]
pub fn unlock_tracker(
    password: String,
    state: State<BayandState>,
    app: AppHandle<Wry>,
) -> Result<(), String> {
    let db_path = state
        .db_path
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?
        .clone();
    let backups_dir = state
        .backups_dir
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?
        .clone();

    if !db_path.exists() {
        return Err("No tracker found. Please create one first.".to_string());
    }

    let db_conn = open_database(&db_path, password, &backups_dir)?;

    let mut db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    *db_state = Some(db_conn);

    info!("Tracker unlocked");

    if let Err(e) = crate::backup::backup_and_rotate(&db_path, &backups_dir) {
        warn!("Failed to create backup: {}", e);
    }

    crate::menu::update_menu_lock_state(&app, false);
    Ok(())
}

#[tauri::command]
pub fn lock_tracker(state: State<BayandState>, app: AppHandle<Wry>) -> Result<(), String> {
    if !super::lock_tracker_inner(&state)? {
        return Err("Tracker is not unlocked".to_string());
    }

    info!("Tracker locked");
    crate::menu::update_menu_lock_state(&app, true);
    super::emit_tracker_locked(&app, "manual");
    Ok(())
}

#[tauri::command]
pub fn tracker_exists(state: State<BayandState>) -> Result<bool, String> {
    let db_path = state
        .db_path
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    Ok(db_path.exists())
}

#[tauri::command]
pub fn is_tracker_unlocked(state: State<BayandState>) -> Result<bool, String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    Ok(db_state.is_some())
}

#[tauri::command]
pub fn change_password(
    old_password: String,
    new_password: String,
    state: State<BayandState>,
) -> Result<(), String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to change password")?;

    let wrapped_key = crate::db::queries::get_wrapped_key(db)?;

    let old_method = crate::auth::password::PasswordMethod::new(old_password);
    let master_key_bytes = old_method
        .unwrap_master_key(&wrapped_key)
        .map_err(|_| "Incorrect current password".to_string())?;

    let new_method = crate::auth::password::PasswordMethod::new(new_password);
    let new_wrapped_key = new_method
        .wrap_master_key(&master_key_bytes)
        .map_err(|e| format!("Failed to re-wrap master key: {}", e))?;

    crate::db::queries::update_wrapped_key(db, &new_wrapped_key)?;

    info!("Password changed successfully");
    Ok(())
}

#[tauri::command]
pub fn reset_tracker(state: State<BayandState>, app: AppHandle<Wry>) -> Result<(), String> {
    let _ = lock_tracker(state.clone(), app.clone());

    let db_path = state
        .db_path
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?
        .clone();

    if !db_path.exists() {
        return Err("No tracker found to reset".to_string());
    }

    std::fs::remove_file(&db_path).map_err(|e| format!("Failed to delete tracker: {}", e))?;

    let backups_dir = state
        .backups_dir
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?
        .clone();
    let _ = std::fs::remove_dir_all(backups_dir);

    info!("Tracker reset");
    crate::menu::update_menu_lock_state(&app, true);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::super::test_helpers::*;
    use crate::db::schema::{create_database, open_database};

    #[test]
    fn test_create_and_unlock() {
        let (state, db_path, backups_dir) = make_state("create_unlock");

        let db_conn = create_database(&db_path, "password".to_string()).unwrap();
        {
            let mut db = state.db.lock().unwrap();
            *db = Some(db_conn);
        }
        assert!(db_path.exists());

        {
            let mut db = state.db.lock().unwrap();
            *db = None;
        }

        let db_conn2 = open_database(&db_path, "password".to_string(), &backups_dir).unwrap();
        {
            let mut db = state.db.lock().unwrap();
            *db = Some(db_conn2);
        }

        assert!(state.db.lock().unwrap().is_some());
        cleanup(&db_path, &backups_dir);
    }

    #[test]
    fn test_lock_tracker_inner_locks_when_unlocked() {
        let (state, db_path, backups_dir) = make_state("lock_inner_unlocked");
        let db_conn = create_database(&db_path, "password".to_string()).unwrap();
        {
            let mut db = state.db.lock().unwrap();
            *db = Some(db_conn);
        }

        let did_lock = super::super::lock_tracker_inner(&state).unwrap();
        assert!(did_lock);
        assert!(state.db.lock().unwrap().is_none());

        cleanup(&db_path, &backups_dir);
    }

    #[test]
    fn test_lock_tracker_inner_noop_when_already_locked() {
        let (state, db_path, backups_dir) = make_state("lock_inner_locked");
        let did_lock = super::super::lock_tracker_inner(&state).unwrap();
        assert!(!did_lock);
        cleanup(&db_path, &backups_dir);
    }
}
