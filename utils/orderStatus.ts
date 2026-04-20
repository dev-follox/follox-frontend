import type { OrderStatusValue } from '../types';

export function normalizeOrderStatus(raw: unknown): OrderStatusValue {
  const s = String(raw).toLowerCase();
  if (s === 'processed' || s.includes('обработан')) return 'processed';
  if (s === 'cancelled' || s.includes('отмен')) return 'cancelled';
  return 'waiting_to_process';
}
