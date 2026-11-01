import type { SystemNotificationSettings } from "../services/notification-settings.service";

export type UpgradeChannel = "email" | "inApp";

/** Which ways the admins hear about a new version: none of them while the whole notice is off. */
export function upgradeChannels(settings: SystemNotificationSettings): Record<UpgradeChannel, boolean> {
  return {
    email: settings.upgradeEnabled && settings.upgradeEmail,
    inApp: settings.upgradeEnabled && settings.upgradeInApp,
  };
}

/**
 * The settings after turning one way on or off. There is no separate switch for the whole notice:
 * it is on while any way is, so turning one on also turns it on and turning both off turns it off.
 */
export function withUpgradeChannel(
  settings: SystemNotificationSettings,
  channel: UpgradeChannel,
  on: boolean,
): SystemNotificationSettings {
  const channels = { ...upgradeChannels(settings), [channel]: on };
  return {
    upgradeEnabled: channels.email || channels.inApp,
    upgradeEmail: channels.email,
    upgradeInApp: channels.inApp,
  };
}
