import { http } from "@modules/app/modules/http/domain/http";
import { Notification, NotificationPreferences } from "../domain/notification";

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

interface ListResponse {
  unreadCount: number;
  notifications: Notification[];
}

export async function getNotifications(
  unreadOnly = false,
): Promise<NotificationsResponse> {
  const res = await http.get<ListResponse>("/notifications", {
    params: { unreadOnly },
  });
  return {
    notifications: res.data.notifications,
    unreadCount: res.data.unreadCount,
  };
}

export async function getUnreadCount(): Promise<number> {
  const res = await http.get<ListResponse>("/notifications", {
    params: { unreadOnly: true },
  });
  return res.data.unreadCount;
}

export async function markAsRead(id: string): Promise<void> {
  await http.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await http.patch("/notifications/read-all");
}

export async function getPreferences(): Promise<NotificationPreferences> {
  const res = await http.get<NotificationPreferences>(
    "/notifications/preferences",
  );
  return res.data;
}

export async function updatePreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await http.put<NotificationPreferences>(
    "/notifications/preferences",
    prefs,
  );
  return res.data;
}
