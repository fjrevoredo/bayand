use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Emitter, Manager, Wry,
};

pub struct LockableMenuItems(pub Vec<tauri::menu::MenuItem<Wry>>);

pub fn build_menu(app: &AppHandle<Wry>) -> tauri::Result<LockableMenuItems> {
    let navigate_prev_day = MenuItemBuilder::with_id("navigate_prev_day", "Previous Day")
        .accelerator("CmdOrCtrl+[")
        .enabled(false)
        .build(app)?;
    let navigate_next_day = MenuItemBuilder::with_id("navigate_next_day", "Next Day")
        .accelerator("CmdOrCtrl+]")
        .enabled(false)
        .build(app)?;
    let navigate_today = MenuItemBuilder::with_id("navigate_today", "Go to Today")
        .accelerator("CmdOrCtrl+T")
        .enabled(false)
        .build(app)?;
    let go_to_date = MenuItemBuilder::with_id("go_to_date", "Go to Date...")
        .accelerator("CmdOrCtrl+G")
        .enabled(false)
        .build(app)?;
    let navigate_prev_month = MenuItemBuilder::with_id("navigate_prev_month", "Previous Month")
        .accelerator("CmdOrCtrl+Shift+[")
        .enabled(false)
        .build(app)?;
    let navigate_next_month = MenuItemBuilder::with_id("navigate_next_month", "Next Month")
        .accelerator("CmdOrCtrl+Shift+]")
        .enabled(false)
        .build(app)?;
    let statistics = MenuItemBuilder::with_id("statistics", "Statistics...")
        .enabled(false)
        .build(app)?;
    let export_item = MenuItemBuilder::with_id("export", "Export...")
        .enabled(false)
        .build(app)?;
    let lock_item = MenuItemBuilder::with_id("lock", "Lock")
        .enabled(false)
        .build(app)?;

    let preferences = MenuItemBuilder::with_id("preferences", "Preferences...")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let about = MenuItemBuilder::with_id("about", "About Bayand").build(app)?;

    let lockable = vec![
        navigate_prev_day.clone(),
        navigate_next_day.clone(),
        navigate_today.clone(),
        go_to_date.clone(),
        navigate_prev_month.clone(),
        navigate_next_month.clone(),
        statistics.clone(),
        export_item.clone(),
        lock_item.clone(),
    ];

    let navigation_menu = SubmenuBuilder::new(app, "Navigation")
        .item(&navigate_prev_day)
        .item(&navigate_next_day)
        .separator()
        .item(&navigate_today)
        .item(&go_to_date)
        .separator()
        .item(&navigate_prev_month)
        .item(&navigate_next_month)
        .build()?;

    let tracker_menu = SubmenuBuilder::new(app, "Tracker")
        .item(&statistics)
        .separator()
        .item(&export_item)
        .separator()
        .item(&lock_item)
        .build()?;

    #[cfg(target_os = "macos")]
    let menu = {
        let app_menu = SubmenuBuilder::new(app, "Bayand")
            .item(&about)
            .separator()
            .item(&preferences)
            .separator()
            .item(&PredefinedMenuItem::services(app, None)?)
            .separator()
            .item(&PredefinedMenuItem::hide(app, None)?)
            .item(&PredefinedMenuItem::hide_others(app, None)?)
            .item(&PredefinedMenuItem::show_all(app, None)?)
            .separator()
            .item(&PredefinedMenuItem::quit(app, None)?)
            .build()?;
        let edit_menu = SubmenuBuilder::new(app, "Edit")
            .item(&PredefinedMenuItem::undo(app, None)?)
            .item(&PredefinedMenuItem::redo(app, None)?)
            .separator()
            .item(&PredefinedMenuItem::cut(app, None)?)
            .item(&PredefinedMenuItem::copy(app, None)?)
            .item(&PredefinedMenuItem::paste(app, None)?)
            .separator()
            .item(&PredefinedMenuItem::select_all(app, None)?)
            .build()?;
        let window_menu = SubmenuBuilder::new(app, "Window")
            .item(&PredefinedMenuItem::minimize(app, None)?)
            .item(&PredefinedMenuItem::maximize(app, None)?)
            .separator()
            .item(&PredefinedMenuItem::close_window(app, None)?)
            .build()?;
        MenuBuilder::new(app)
            .item(&app_menu)
            .item(&edit_menu)
            .item(&navigation_menu)
            .item(&tracker_menu)
            .item(&window_menu)
            .build()?
    };

    #[cfg(not(target_os = "macos"))]
    let menu = {
        let file_menu = SubmenuBuilder::new(app, "File")
            .item(&preferences)
            .separator()
            .item(&PredefinedMenuItem::quit(app, None)?)
            .build()?;
        let help_menu = SubmenuBuilder::new(app, "Help").item(&about).build()?;
        MenuBuilder::new(app)
            .item(&file_menu)
            .item(&navigation_menu)
            .item(&tracker_menu)
            .item(&help_menu)
            .build()?
    };

    app.set_menu(menu.clone())?;

    app.on_menu_event(move |app, event| match event.id().as_ref() {
        "navigate_prev_day" => {
            let _ = app.emit("menu-navigate-previous-day", ());
        }
        "navigate_next_day" => {
            let _ = app.emit("menu-navigate-next-day", ());
        }
        "navigate_today" => {
            let _ = app.emit("menu-navigate-to-today", ());
        }
        "go_to_date" => {
            let _ = app.emit("menu-go-to-date", ());
        }
        "navigate_prev_month" => {
            let _ = app.emit("menu-navigate-previous-month", ());
        }
        "navigate_next_month" => {
            let _ = app.emit("menu-navigate-next-month", ());
        }
        "preferences" => {
            let _ = app.emit("menu-preferences", ());
        }
        "statistics" => {
            let _ = app.emit("menu-statistics", ());
        }
        "export" => {
            let _ = app.emit("menu-export", ());
        }
        "about" => {
            let _ = app.emit("menu-about", ());
        }
        "lock" => {
            let _ = app.emit("menu-lock", ());
        }
        _ => {}
    });

    Ok(LockableMenuItems(lockable))
}

pub fn update_menu_lock_state(app: &AppHandle<Wry>, locked: bool) {
    if let Some(state) = app.try_state::<LockableMenuItems>() {
        for item in &state.0 {
            let _ = item.set_enabled(!locked);
        }
    }
}
