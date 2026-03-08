# Bayand User Guide

## First Launch

On first launch, Bayand checks whether a tracker already exists.

- If no tracker exists, create one by entering and confirming a password
- If a tracker exists, enter the password to unlock it

Bayand does not support password recovery. Keep the password safe.

## Locking and Unlocking

When unlocked, Bayand decrypts record payloads in memory so you can view and edit them. You can lock the tracker manually from the header or app menu.

If idle auto-lock is enabled in Preferences, Bayand locks itself after the configured period of inactivity.

## Working With Records

Bayand is organized around dates and records.

- Select a day from the calendar
- Create a record for that day
- Add structured health information and optional notes
- Bayand saves changes automatically after a short debounce

Bayand supports multiple records on the same day. Use the record navigator to move between records for the selected date or create another one.

## Record Sections

Each record can contain:

- Title
- Symptoms
- Medications / Supplements
- Vitals
- Sleep
- Wellbeing
- Notes

Notes are optional rich-text HTML content. The other sections are structured health fields intended for quick daily logging.

## Calendar and Navigation

The sidebar calendar shows the selected month. Dates that already contain records are highlighted by the app.

Available navigation actions:

- previous day
- next day
- today
- previous month
- next month
- go to date

## Preferences

Preferences are stored locally on the device and include:

- theme
- first day of week
- allow future records
- hide titles
- spellcheck
- auto-lock settings
- advanced toolbar mode
- escape-key behavior

Preferences also provide:

- change password
- reset tracker

Reset tracker permanently deletes the local tracker data. Use it carefully.

## Statistics

The statistics view summarizes usage and selected wellness metrics, including streaks, record counts, symptom days, medication days, and available averages for mood, energy, and sleep duration.

## Export

Bayand v1 supports JSON export only.

- Export is initiated by the user
- The export file contains decrypted record data and metadata
- Export files are plaintext and should be stored securely

## Backups

Bayand creates local encrypted database backups after successful unlock. Backups help recover from local database corruption or accidental file damage, but they do not replace the need to protect exported files.
