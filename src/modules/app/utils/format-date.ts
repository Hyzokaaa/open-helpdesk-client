export type DateFormatOption = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export function formatDate(date: string | Date, format: DateFormatOption = 'DD/MM/YYYY', timezone?: string): string {
  const tz = timezone && timezone !== 'auto' ? timezone : undefined;
  const d = new Date(date);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const day = get('day');
  const month = get('month');
  const year = get('year');
  const hours = get('hour');
  const minutes = get('minute');
  const seconds = get('second');
  const time = `${hours}:${minutes}:${seconds}`;

  switch (format) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year} ${time}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day} ${time}`;
    case 'DD/MM/YYYY':
    default: return `${day}/${month}/${year} ${time}`;
  }
}
