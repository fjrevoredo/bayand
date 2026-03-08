use crate::db::schema::DatabaseConnection;
use log::{info, warn};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State, Wry};

pub struct BayandState {
    pub db: Mutex<Option<DatabaseConnection>>,
    pub db_path: Mutex<PathBuf>,
    pub backups_dir: Mutex<PathBuf>,
    pub app_data_dir: PathBuf,
}

impl BayandState {
    pub fn new(db_path: PathBuf, backups_dir: PathBuf, app_data_dir: PathBuf) -> Self {
        Self {
            db: Mutex::new(None),
            db_path: Mutex::new(db_path),
            backups_dir: Mutex::new(backups_dir),
            app_data_dir,
        }
    }
}

#[derive(Clone, serde::Serialize)]
struct TrackerLockedEventPayload {
    reason: String,
}

fn lock_tracker_inner(state: &BayandState) -> Result<bool, String> {
    let mut db_state = state
        .db
        .lock()
        .map_err(|_| "Failed to access tracker state".to_string())?;

    if db_state.is_none() {
        return Ok(false);
    }

    *db_state = None;
    Ok(true)
}

fn emit_tracker_locking(app: &AppHandle<Wry>, reason: &str) {
    if let Err(error) = app.emit("tracker-locking", reason) {
        warn!("Failed to emit tracker-locking event: {}", error);
    }
}

fn emit_tracker_locked(app: &AppHandle<Wry>, reason: &str) {
    let payload = TrackerLockedEventPayload {
        reason: reason.to_string(),
    };
    if let Err(error) = app.emit("tracker-locked", payload.clone()) {
        warn!("Failed to emit tracker-locked event: {}", error);
    }
}

pub(crate) fn auto_lock_tracker_if_unlocked(
    state: State<BayandState>,
    app: AppHandle<Wry>,
    reason: &str,
) -> Result<bool, String> {
    emit_tracker_locking(&app, reason);
    let did_lock = lock_tracker_inner(&state)?;

    if did_lock {
        info!("Tracker auto-locked ({})", reason);
        crate::menu::update_menu_lock_state(&app, true);
        emit_tracker_locked(&app, reason);
    }

    Ok(did_lock)
}

mod auth_core;

pub use auth_core::*;

#[cfg(test)]
pub(crate) mod test_helpers {
    use super::*;
    use std::fs;

    pub fn temp_db_path(name: &str) -> PathBuf {
        PathBuf::from(format!("test_bayand_auth_{}.db", name))
    }

    pub fn temp_backups_dir(name: &str) -> PathBuf {
        PathBuf::from(format!("test_bayand_backups_{}", name))
    }

    pub fn cleanup(db_path: &PathBuf, backups_dir: &PathBuf) {
        let _ = fs::remove_file(db_path);
        let _ = fs::remove_dir_all(backups_dir);
    }

    pub fn make_state(name: &str) -> (BayandState, PathBuf, PathBuf) {
        let db_path = temp_db_path(name);
        let backups_dir = temp_backups_dir(name);
        let _ = fs::remove_file(&db_path);
        let _ = fs::remove_dir_all(&backups_dir);
        let state = BayandState::new(db_path.clone(), backups_dir.clone(), PathBuf::from("."));
        (state, db_path, backups_dir)
    }
}
