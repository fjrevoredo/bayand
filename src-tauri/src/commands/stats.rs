use crate::commands::auth::BayandState;
use crate::db::queries::HealthRecord;
use chrono::{Datelike, NaiveDate};
use tauri::State;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Statistics {
    pub total_records: i32,
    pub records_this_week: i32,
    pub best_streak: i32,
    pub current_streak: i32,
    pub days_with_symptoms: i32,
    pub days_with_medications: i32,
    pub avg_mood_score: Option<f64>,
    pub avg_energy_score: Option<f64>,
    pub avg_sleep_duration_minutes: Option<f64>,
}

#[tauri::command]
pub fn get_statistics(state: State<BayandState>) -> Result<Statistics, String> {
    let db_state = state
        .db
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?;
    let db = db_state
        .as_ref()
        .ok_or("Tracker must be unlocked to view statistics")?;

    let records = crate::db::queries::get_all_records(db)?;
    calculate_statistics(&records)
}

fn calculate_statistics(records: &[HealthRecord]) -> Result<Statistics, String> {
    let total_records = records.len() as i32;

    let mut dates: Vec<String> = records.iter().map(|record| record.date.clone()).collect();
    dates.sort();
    dates.dedup();

    let best_streak = calculate_best_streak(&dates)?;
    let current_streak =
        calculate_current_streak(&dates, &chrono::Local::now().format("%Y-%m-%d").to_string())?;

    let today = chrono::Local::now().date_naive();
    let week_start = today - chrono::Duration::days(today.weekday().num_days_from_monday() as i64);
    let week_start_str = week_start.format("%Y-%m-%d").to_string();
    let records_this_week = records
        .iter()
        .filter(|record| record.date >= week_start_str)
        .count() as i32;

    let days_with_symptoms = dates
        .iter()
        .filter(|date| {
            records
                .iter()
                .any(|record| &record.date == *date && !record.symptoms.is_empty())
        })
        .count() as i32;
    let days_with_medications = dates
        .iter()
        .filter(|date| {
            records
                .iter()
                .any(|record| &record.date == *date && !record.medications.is_empty())
        })
        .count() as i32;

    Ok(Statistics {
        total_records,
        records_this_week,
        best_streak,
        current_streak,
        days_with_symptoms,
        days_with_medications,
        avg_mood_score: average(
            records
                .iter()
                .filter_map(|r| r.wellbeing.as_ref().and_then(|w| w.mood_score).map(|v| v as f64)),
        ),
        avg_energy_score: average(
            records
                .iter()
                .filter_map(|r| r.wellbeing.as_ref().and_then(|w| w.energy_score).map(|v| v as f64)),
        ),
        avg_sleep_duration_minutes: average(
            records
                .iter()
                .filter_map(|r| r.sleep.as_ref().and_then(|s| s.duration_minutes).map(|v| v as f64)),
        ),
    })
}

fn average(values: impl Iterator<Item = f64>) -> Option<f64> {
    let values: Vec<f64> = values.collect();
    if values.is_empty() {
        None
    } else {
        Some(values.iter().sum::<f64>() / values.len() as f64)
    }
}

fn calculate_best_streak(dates: &[String]) -> Result<i32, String> {
    if dates.is_empty() {
        return Ok(0);
    }

    let mut max_streak = 1;
    let mut current_streak = 1;

    for i in 1..dates.len() {
        let days_diff = days_between(&dates[i - 1], &dates[i])?;
        if days_diff == 1 {
            current_streak += 1;
            max_streak = max_streak.max(current_streak);
        } else {
            current_streak = 1;
        }
    }

    Ok(max_streak)
}

fn calculate_current_streak(dates: &[String], today: &str) -> Result<i32, String> {
    if dates.is_empty() {
        return Ok(0);
    }

    let last_date = &dates[dates.len() - 1];
    let days_from_today = days_between(last_date, today)?;

    if days_from_today > 1 {
        return Ok(0);
    }

    let mut streak = 1;
    for i in (0..dates.len() - 1).rev() {
        let days_diff = days_between(&dates[i], &dates[i + 1])?;
        if days_diff == 1 {
            streak += 1;
        } else {
            break;
        }
    }

    Ok(streak)
}

fn days_between(date1: &str, date2: &str) -> Result<i64, String> {
    let d1 = NaiveDate::parse_from_str(date1, "%Y-%m-%d")
        .map_err(|e| format!("Invalid date format '{}': {}", date1, e))?;
    let d2 = NaiveDate::parse_from_str(date2, "%Y-%m-%d")
        .map_err(|e| format!("Invalid date format '{}': {}", date2, e))?;

    Ok((d2 - d1).num_days())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::queries::{HealthRecord, MedicationLog, SleepSummary, SymptomLog, WellbeingSummary};

    #[test]
    fn test_days_between() {
        assert_eq!(days_between("2024-01-01", "2024-01-02").unwrap(), 1);
        assert_eq!(days_between("2024-01-01", "2024-01-01").unwrap(), 0);
        assert_eq!(days_between("2024-01-31", "2024-02-01").unwrap(), 1);
    }

    #[test]
    fn test_best_streak_with_gaps() {
        let dates = vec![
            "2024-01-01".to_string(),
            "2024-01-02".to_string(),
            "2024-01-03".to_string(),
            "2024-01-10".to_string(),
            "2024-01-11".to_string(),
        ];
        assert_eq!(calculate_best_streak(&dates).unwrap(), 3);
    }

    #[test]
    fn test_statistics_calculation() {
        let records = vec![
            HealthRecord {
                id: 1,
                date: "2024-01-01".to_string(),
                title: "A".to_string(),
                notes_html: "<p>A</p>".to_string(),
                created_at: "2024-01-01T12:00:00Z".to_string(),
                updated_at: "2024-01-01T12:00:00Z".to_string(),
                symptoms: vec![SymptomLog {
                    name: "Headache".to_string(),
                    severity: Some(3),
                    time: None,
                    tags: vec![],
                    note: None,
                }],
                medications: vec![],
                vitals: None,
                sleep: Some(SleepSummary {
                    bedtime: None,
                    wake_time: None,
                    duration_minutes: Some(420),
                    quality_score: None,
                }),
                wellbeing: Some(WellbeingSummary {
                    mood_score: Some(4),
                    energy_score: Some(3),
                    stress_score: None,
                }),
            },
            HealthRecord {
                id: 2,
                date: "2024-01-02".to_string(),
                title: "B".to_string(),
                notes_html: "<p>B</p>".to_string(),
                created_at: "2024-01-02T12:00:00Z".to_string(),
                updated_at: "2024-01-02T12:00:00Z".to_string(),
                symptoms: vec![],
                medications: vec![MedicationLog {
                    name: "Vitamin D".to_string(),
                    dose: Some(1.0),
                    unit: Some("tablet".to_string()),
                    time: None,
                    taken: true,
                    note: None,
                }],
                vitals: None,
                sleep: Some(SleepSummary {
                    bedtime: None,
                    wake_time: None,
                    duration_minutes: Some(480),
                    quality_score: None,
                }),
                wellbeing: Some(WellbeingSummary {
                    mood_score: Some(2),
                    energy_score: Some(5),
                    stress_score: None,
                }),
            },
        ];

        let stats = calculate_statistics(&records).unwrap();
        assert_eq!(stats.total_records, 2);
        assert_eq!(stats.best_streak, 2);
        assert_eq!(stats.days_with_symptoms, 1);
        assert_eq!(stats.days_with_medications, 1);
        assert_eq!(stats.avg_mood_score, Some(3.0));
        assert_eq!(stats.avg_energy_score, Some(4.0));
        assert_eq!(stats.avg_sleep_duration_minutes, Some(450.0));
    }

    #[test]
    fn test_statistics_empty() {
        let stats = calculate_statistics(&[]).unwrap();
        assert_eq!(stats.total_records, 0);
        assert_eq!(stats.best_streak, 0);
        assert_eq!(stats.current_streak, 0);
        assert_eq!(stats.avg_mood_score, None);
    }
}
