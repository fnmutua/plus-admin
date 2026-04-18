import dayjs, { type Dayjs } from 'dayjs'

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Element Plus `disabled-date`: block calendar days before today (local). */
export function disableRoleExpiryDatesBeforeToday(date: Date): boolean {
  return startOfLocalDay(date) < startOfLocalDay(new Date())
}

/** `disabled-hours` for datetime: on today, hours before current hour. */
export function disableRoleExpiryHours(_role: string, comparingDate?: Dayjs): number[] {
  if (!comparingDate) return []
  const now = dayjs()
  if (!comparingDate.isSame(now, 'day')) return []
  return Array.from({ length: now.hour() }, (_, i) => i)
}

/** `disabled-minutes` for datetime: on today at current hour, minutes before now. */
export function disableRoleExpiryMinutes(
  hour: number,
  _role: string,
  comparingDate?: Dayjs
): number[] {
  if (!comparingDate) return []
  const now = dayjs()
  if (!comparingDate.isSame(now, 'day')) return []
  if (hour < now.hour()) return Array.from({ length: 60 }, (_, i) => i)
  if (hour > now.hour()) return []
  return Array.from({ length: now.minute() }, (_, i) => i)
}

/** `disabled-seconds` for datetime: on today at current hour/minute, seconds before now. */
export function disableRoleExpirySeconds(
  hour: number,
  minute: number,
  _role: string,
  comparingDate?: Dayjs
): number[] {
  if (!comparingDate) return []
  const now = dayjs()
  if (!comparingDate.isSame(now, 'day')) return []
  if (hour < now.hour() || (hour === now.hour() && minute < now.minute())) {
    return Array.from({ length: 60 }, (_, i) => i)
  }
  if (hour === now.hour() && minute === now.minute()) {
    return Array.from({ length: now.second() }, (_, i) => i)
  }
  return []
}
