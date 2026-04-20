/** Normalized lifecycle for display (broader than API `OrderStatusValue`). */
export type NormalizedOrderStatus =
  | 'waiting_to_process'
  | 'processed'
  | 'cancelled'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'refunded'
  | 'unknown';

export function normalizeOrderStatus(raw: unknown): NormalizedOrderStatus {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return 'unknown';

  if (s === 'waiting_to_process') return 'waiting_to_process';
  if (s === 'processed') return 'processed';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'paid') return 'paid';
  if (s === 'shipped' || s === 'shipping') return 'shipped';
  if (s === 'delivered') return 'delivered';
  if (s === 'refunded' || s === 'refund') return 'refunded';
  if (s === 'processing' || s === 'in_progress') return 'waiting_to_process';
  if (s === 'pending' || s === 'new' || s === 'awaiting' || s === 'awaiting_fulfillment') return 'waiting_to_process';
  if (s === 'rejected') return 'cancelled';
  if (s === 'completed' || s === 'complete' || s === 'fulfilled' || s === 'done') return 'paid';

  if (s === 'unpaid') return 'waiting_to_process';
  if (s.includes('отмен') || s.includes('cancel')) return 'cancelled';
  if (s.includes('ожидает') || s.includes('await')) return 'waiting_to_process';
  if (s.includes('оплач') || s.includes('выплач')) return 'paid';
  if (s.includes('доставлен')) return 'delivered';
  if (s.includes('отправ') || s.includes('ship')) return 'shipped';
  if (s.includes('возврат') || s.includes('refund')) return 'refunded';
  if (s.includes('обработан')) return 'processed';

  return 'unknown';
}

const STATUS_I18N: Record<NormalizedOrderStatus, string> = {
  waiting_to_process: 'productDetails.orders.statusWaiting',
  processed: 'productDetails.orders.statusProcessed',
  cancelled: 'productDetails.orders.statusCancelled',
  paid: 'productDetails.orders.statusPaid',
  shipped: 'productDetails.orders.statusShipped',
  delivered: 'productDetails.orders.statusDelivered',
  refunded: 'productDetails.orders.statusRefunded',
  unknown: 'productDetails.orders.statusUnknown',
};

export function orderStatusLabel(t: (key: string) => string, raw: unknown): string {
  const n = normalizeOrderStatus(raw);
  if (n === 'unknown') {
    const rawStr = String(raw ?? '').trim();
    if (rawStr) return rawStr;
  }
  return t(STATUS_I18N[n]);
}
