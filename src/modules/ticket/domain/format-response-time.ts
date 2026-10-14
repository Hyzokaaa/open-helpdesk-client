/** "45m", "3h 45m", "2d 3h": a span of time, as the ticket sidebar shows it. */
export function formatDuration(ms: number): string {
  if (ms < 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatResponseTime(createdAt: string, firstResponseAt: string): string {
  return formatDuration(new Date(firstResponseAt).getTime() - new Date(createdAt).getTime());
}
