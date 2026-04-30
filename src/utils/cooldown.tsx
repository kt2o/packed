/**
 * Determine whether the user can check in again.
 *
 * A new check-in is allowed if the last check-in occurred at least 30 minutes ago.
 */
export function canCheckIn(lastCheckin: Date | null, now: Date = new Date()) {
  if (!lastCheckin) return true;

  const diffMinutes =
    (now.getTime() - lastCheckin.getTime()) / (1000 * 60);

  return diffMinutes >= 30;
}
