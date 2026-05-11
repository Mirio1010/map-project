/**
 * Helpers for recurring “scheduled” pins: date range + days of week + daily time window.
 * Times are interpreted in the user’s local timezone.
 */

/** @type {readonly string[]} */
const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Turn an "HH:MM" string into minutes since midnight; returns NaN if invalid.
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return NaN;
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return NaN;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

/**
 * Format "YYYY-MM-DD" in local time (no TZ shift).
 */
export function formatLocalISODate(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/**
 * Add calendar days to a date in local time.
 */
export function addLocalDays(d, deltaDays) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + deltaDays);
  return copy;
}

/**
 * Compare two ISO date strings (YYYY-MM-DD) — returns negative if a < b.
 */
function compareISODates(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Returns true if the pin's schedule says it should be visible right now.
 * Permanent pins pass through (schedule is null/undefined).
 *
 * @param {object|null|undefined} schedule -
 * @returns {boolean}
 */
export function isScheduledPinActive(schedule) {
  if (schedule == null) return true;
  // Empty JSON object from DB reads as {} — treat like “no schedule” so permanent pins stay visible.
  if (typeof schedule === "object" && Object.keys(schedule).length === 0) return true;

  const { startTime, endTime, startDate, endDate, daysOfWeek } = schedule;
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    typeof startTime !== "string" ||
    typeof endTime !== "string" ||
    !Array.isArray(daysOfWeek) ||
    daysOfWeek.length === 0
  ) {
    return false;
  }

  const now = new Date();
  const todayIso = formatLocalISODate(now);
  if (compareISODates(todayIso, startDate) < 0 || compareISODates(todayIso, endDate) > 0) {
    return false;
  }

  const dow = now.getDay();
  if (!daysOfWeek.includes(dow)) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (Number.isNaN(startMin) || Number.isNaN(endMin)) return false;
  return nowMin >= startMin && nowMin <= endMin;
}

/**
 * Build abbreviated day list like "Mon, Wed, Fri" from JS day numbers (0=Sun … 6=Sat).
 */
export function abbreviateDaysOfWeek(daysSorted) {
  const unique = [...new Set(daysSorted)].sort((a, b) => a - b);
  return unique.map((d) => DAY_LABELS_SHORT[d]).join(", ");
}

/**
 * Find when this schedule next becomes active after `from` (exclusive of “currently active”).
 * Used to label “next window” text in lists.
 *
 * @param {object} schedule
 * @param {Date} [from]
 * @returns {Date|null}
 */
export function findNextScheduledWindowStart(schedule, from = new Date()) {
  if (!schedule?.daysOfWeek?.length || !schedule.startDate || !schedule.endDate) {
    return null;
  }

  const startMinTotal = parseTimeToMinutes(schedule.startTime || "");
  const endMinTotal = parseTimeToMinutes(schedule.endTime || "");
  if (Number.isNaN(startMinTotal) || Number.isNaN(endMinTotal)) return null;

  const cursor = addLocalDays(from, 0);
  for (let offset = 0; offset <= 366; offset += 1) {
    const d = addLocalDays(cursor, offset);
    const iso = formatLocalISODate(d);
    if (compareISODates(iso, schedule.endDate) > 0) break;
    if (compareISODates(iso, schedule.startDate) < 0) continue;

    if (!schedule.daysOfWeek.includes(d.getDay())) continue;

    const atStartOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const slotStart = new Date(atStartOfDay);
    slotStart.setHours(Math.floor(startMinTotal / 60), startMinTotal % 60, 0, 0);

    const slotEnd = new Date(atStartOfDay);
    slotEnd.setHours(Math.floor(endMinTotal / 60), endMinTotal % 60, 0, 0);

    if (offset === 0) {
      if (from <= slotEnd && from >= slotStart) continue;
      if (from < slotStart) return slotStart;
      continue;
    }

    return slotStart;
  }
  return null;
}

/**
 * One-line subtitle for sidebar: “Active now” or next/day pattern + window.
 *
 * @param {object|null|undefined} schedule
 */
export function getScheduledPinSubtitle(schedule) {
  if (!schedule?.daysOfWeek?.length || !schedule.startTime || !schedule.endTime) {
    return "";
  }

  const activeNow = isScheduledPinActive(schedule);
  const daysPart = abbreviateDaysOfWeek(schedule.daysOfWeek);
  const timePart = `${schedule.startTime}–${schedule.endTime}`;

  if (activeNow) {
    return { kind: "active", text: "Active now", daysPart, timePart };
  }

  const nextStart = findNextScheduledWindowStart(schedule);
  const nextDayLabel = nextStart ? DAY_LABELS_SHORT[nextStart.getDay()] : null;
  if (nextDayLabel) {
    return {
      kind: "next",
      text: `${nextDayLabel} · ${timePart}`,
      daysPart,
      timePart,
    };
  }

  return { kind: "summary", text: `${daysPart} · ${timePart}`, daysPart, timePart };
}

/**
 * One line for lists: "Next active: Fri 14:00–18:00" when the pin is not in its window.
 * Empty string if no schedule or pin is active now.
 */
export function formatNextActiveLine(schedule) {
  if (!schedule?.daysOfWeek?.length || !schedule.startTime || !schedule.endTime) {
    return "";
  }
  if (isScheduledPinActive(schedule)) return "";

  const nextStart = findNextScheduledWindowStart(schedule);
  const dayLabel = nextStart ? DAY_LABELS_SHORT[nextStart.getDay()] : null;
  const timePart = `${schedule.startTime}–${schedule.endTime}`;
  if (dayLabel) {
    return `Next active: ${dayLabel} ${timePart}`;
  }
  return "";
}
