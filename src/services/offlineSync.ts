export interface PendingOfflineInvoice {
  id: string;
  businessId: number;
  payload: any;
  createdAt: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'smart_billing_offline_queue';

export const offlineSync = {
  getQueue(): PendingOfflineInvoice[] {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueue(businessId: number, payload: any): PendingOfflineInvoice {
    const queue = this.getQueue();
    const item: PendingOfflineInvoice = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      businessId,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return item;
  },

  dequeue(id: string) {
    const queue = this.getQueue().filter(item => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
};
