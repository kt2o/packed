export function canCheckIn(lastCheckin: Date | null, now: Date = new Date()) {
  if (!lastCheckin) return true;

  const diffMinutes =
    (now.getTime() - lastCheckin.getTime()) / (1000 * 60);

  return diffMinutes >= 30;
}
