import { describe, expect, it } from "vitest";
import { upgradeChannels, withUpgradeChannel } from "./upgrade-notify";

const settings = (upgradeEnabled: boolean, upgradeEmail: boolean, upgradeInApp: boolean) => ({ upgradeEnabled, upgradeEmail, upgradeInApp });

describe("Telling the admins about new versions", () => {
  it("shows a way as on only while the whole notice is on", () => {
    expect(upgradeChannels(settings(true, true, false))).toEqual({ email: true, inApp: false });
    expect(upgradeChannels(settings(false, true, true))).toEqual({ email: false, inApp: false });
  });

  it("turns the whole notice on with the first way turned on", () => {
    expect(withUpgradeChannel(settings(false, true, true), "email", true)).toEqual(settings(true, true, false));
  });

  it("keeps the notice on while another way is still on", () => {
    expect(withUpgradeChannel(settings(true, true, true), "inApp", false)).toEqual(settings(true, true, false));
  });

  it("turns the whole notice off with the last way turned off", () => {
    expect(withUpgradeChannel(settings(true, true, false), "email", false)).toEqual(settings(false, false, false));
  });
});
