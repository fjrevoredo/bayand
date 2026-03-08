pub mod auth;
pub mod backup;
pub mod commands;
pub mod crypto;
pub mod db;
pub mod export;
pub mod menu;
pub mod screen_lock;

use commands::auth::BayandState;
use log::{info, warn};
use std::path::PathBuf;
use tauri::Manager;

fn is_e2e_mode() -> bool {
    matches!(std::env::var("BAYAND_E2E").as_deref(), Ok("1"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("bayand_lib=info"))
        .init();
    info!("Bayand starting");

    let is_e2e = is_e2e_mode();
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());

    if is_e2e {
        info!("E2E mode detected (BAYAND_E2E=1): window-state persistence disabled");
    } else {
        builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());
    }

    builder
        .setup(|app| {
            let system_app_dir = match app.path().app_data_dir() {
                Ok(dir) => dir,
                Err(e) => {
                    warn!(
                        "Could not determine app data directory ({}), using CWD as fallback",
                        e
                    );
                    PathBuf::from(".")
                }
            };

            let app_dir = if let Ok(e2e_app_dir) = std::env::var("BAYAND_APP_DIR") {
                info!("Using E2E app dir override: {}", e2e_app_dir);
                PathBuf::from(e2e_app_dir)
            } else {
                system_app_dir
            };

            if let Err(e) = std::fs::create_dir_all(&app_dir) {
                warn!(
                    "Failed to create app directory '{}': {}",
                    app_dir.display(),
                    e
                );
            }

            let db_path = app_dir.join("bayand.db");
            let backups_dir = app_dir.join("backups");

            app.manage(BayandState::new(db_path, backups_dir, app_dir));
            app.manage(menu::build_menu(app.handle())?);

            if let Err(error) = screen_lock::init(app.handle()) {
                warn!("Screen-lock listener initialization failed: {}", error);
            }

            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::create_tracker,
            commands::auth::unlock_tracker,
            commands::auth::lock_tracker,
            commands::auth::tracker_exists,
            commands::auth::is_tracker_unlocked,
            commands::auth::change_password,
            commands::auth::reset_tracker,
            commands::records::create_record,
            commands::records::save_record,
            commands::records::get_records_for_date,
            commands::records::delete_record_if_empty,
            commands::records::delete_record,
            commands::records::get_all_record_dates,
            commands::navigation::navigate_previous_day,
            commands::navigation::navigate_next_day,
            commands::navigation::navigate_to_today,
            commands::navigation::navigate_previous_month,
            commands::navigation::navigate_next_month,
            commands::stats::get_statistics,
            commands::export::export_json,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
