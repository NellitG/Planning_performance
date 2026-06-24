import type { NotificationWithRead } from "./types";
import { notifications as initialNotifications } from "./mockData";

type Listener = () => void;

const listeners = new Set<Listener>();
const notifications: NotificationWithRead[] = initialNotifications.map((item) => ({ ...item, read: false }));

export function getNotifications(): NotificationWithRead[] {
  return notifications;
}

export function getUnreadCount(): number {
  return notifications.filter((item) => !item.read).length;
}

export function markAsRead(id: number): void {
  const notification = notifications.find((item) => item.id === id);
  if (notification && !notification.read) {
    notification.read = true;
    listeners.forEach((listener) => listener());
  }
}

export function markAllAsRead(): void {
  let changed = false;
  for (const notification of notifications) {
    if (!notification.read) {
      notification.read = true;
      changed = true;
    }
  }
  if (changed) {
    listeners.forEach((listener) => listener());
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
