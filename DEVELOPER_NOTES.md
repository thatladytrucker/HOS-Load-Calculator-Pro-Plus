# HOS Load Calculator Master-v7 Developer Notes

## Version
Master-v7.0.0

---

## HOS Clock Logic

The HOS clock system is currently implemented as a planning and training tool.

Current supported status tracking:

- On Duty
- Driving
- Break (30 minutes)
- Off Duty
- Sleeper Berth
- Off (End Day)

The "Let's Roll" button starts the driver's duty day and begins On Duty tracking.

---

## HOS Accrual Logic Decision

The HOS accrual logic was reviewed during Master-v7 cleanup.

The current implementation was intentionally left unchanged after validation testing confirmed:

- On Duty clock counts correctly
- Driving clock counts correctly
- 14-hour duty window counts correctly
- 70-hour / 8-day tracking counts correctly
- Status switching works correctly

Future cleanup should only be performed after regression testing confirms no impact to clock accuracy.

---

## Development Philosophy

Master-v7 is the stable development foundation for:

- Base Version
- PRO Version
- PRO Plus Version

Changes should be tested before moving forward.

Stable checkpoints should be created after major milestones.

---

## Current Status

Master-v7.0.0 has passed:

- PWA verification
- Netlify deployment testing
- HOS clock testing
- ETA testing
- Recent trip testing
