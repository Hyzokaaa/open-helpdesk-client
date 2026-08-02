export type DateFormatOption = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export function formatDate(date: string | Date, format: DateFormatOption = 'DD/MM/YYYY'): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const time = `${hours}:${minutes}:${seconds}`;

  switch (format) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year} ${time}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day} ${time}`;
    case 'DD/MM/YYYY':
    default: return `${day}/${month}/${year} ${time}`;
  }
}
