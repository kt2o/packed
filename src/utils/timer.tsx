/**
 * Calculates how many seconds are left in a timer.
 *
 * @param startTime - When the timer started
 * @param durationMinutes - How long the timer should run (in minutes)
 * @returns number of seconds remaining (never negative)
 */
export function calculateRemainingTime(
  startTime: Date,
  durationMinutes: number
): number {
  const now = new Date();

  const elapsedMs = now.getTime() - startTime.getTime();
  const totalMs = durationMinutes * 60 * 1000;

  const remainingMs = totalMs - elapsedMs;

  // Never return negative time
  return Math.max(0, Math.floor(remainingMs / 1000));
}
