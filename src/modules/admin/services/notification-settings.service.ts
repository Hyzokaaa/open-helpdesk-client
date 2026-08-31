import { http } from "@modules/app/modules/http/domain/http";

export interface SystemNotificationSettings {
  upgradeEnabled: boolean;
  upgradeEmail: boolean;
  upgradeInApp: boolean;
}

export async function getNotificationSettings(): Promise<SystemNotificationSettings> {
  const res = await http.get<SystemNotificationSettings>("/admin/notification-settings");
  return res.data;
}

export async function updateNotificationSettings(
  data: Partial<SystemNotificationSettings>,
): Promise<SystemNotificationSettings> {
  const res = await http.put<SystemNotificationSettings>("/admin/notification-settings", data);
  return res.data;
}
