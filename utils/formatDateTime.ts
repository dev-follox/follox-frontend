import { format } from 'date-fns';

/** Display format for all user-visible timestamps: `dd.MM.yyyy HH:mm` */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (dateString == null || dateString === '') return '—';
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'dd.MM.yyyy HH:mm');
}
