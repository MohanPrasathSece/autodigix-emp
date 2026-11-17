import { useCallback, useState } from 'react';

const storageKey = (userId: string) => `read-notifications:${userId}`;

const loadReadIds = (userId?: string): Set<string> => {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

/**
 * Tracks read state for the current user.
 *
 * Broadcast notifications ("all" / "admin") are stored as a single shared row,
 * so writing `is_read` to the DB would mark them read for every user. Their
 * read state is therefore kept locally per user. Personal notifications
 * (target_id = employee id) are unique per user and use the DB flag.
 */
export function useNotificationRead(userId?: string) {
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds(userId));

  const isRead = useCallback(
    (notification: { id: number | string; target_id?: string; is_read?: boolean }) => {
      if (notification.target_id === 'all' || notification.target_id === 'admin') {
        return readIds.has(String(notification.id));
      }
      return !!notification.is_read;
    },
    [readIds]
  );

  const isBroadcast = (notification: { target_id?: string }) =>
    notification.target_id === 'all' || notification.target_id === 'admin';

  const markLocalRead = useCallback(
    (id: number | string) => {
      if (!userId) return;
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(String(id));
        try {
          localStorage.setItem(storageKey(userId), JSON.stringify([...next]));
        } catch {
          // ignore storage failures (private mode, quota, etc.)
        }
        return next;
      });
    },
    [userId]
  );

  return { isRead, isBroadcast, markLocalRead };
}
