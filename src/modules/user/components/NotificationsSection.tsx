import { useContext, useEffect, useState } from "react";
import Switch from "@modules/app/modules/ui/components/Switch/Switch";
import { toast } from "react-toastify";
import clsx from "clsx";
import Card from "@modules/app/modules/ui/components/Card/Card";
import {
  getNoticePreferences,
  getPreferences,
  updateNoticePreference,
  updatePreferences,
} from "@modules/notification/services/notification.service";
import { NoticeChannel, NoticeSetting, NotificationPreferences } from "@modules/notification/domain/notification";
import useTranslation from "@modules/app/i18n/useTranslation";
import useUser from "@modules/user/hooks/useUser";
import { ConfigContext } from "@modules/app/context/config-context";
import { MyMatrixDto, getMyMatrix } from "@modules/notification/services/matrix-account.service";
import MatrixAccountCard from "./MatrixAccountCard";
import MatrixSetupCard from "./MatrixSetupCard";
import NoticePreferenceRows from "./NoticePreferenceRows";

const EVENT_KEYS = [
  { key: "TicketCreated", labelKey: "notifications.ticketCreated" },
  { key: "TicketAssigned", labelKey: "notifications.ticketAssigned" },
  { key: "StatusChanged", labelKey: "notifications.statusChanged" },
  // In-app only: a call to action for admins and supervisors, there is no email for it
  { key: "TicketUnassigned", labelKey: "notifications.ticketUnassigned", inAppOnly: true },
  // For admins and supervisors: a customer answered a ticket nobody on the team owns or follows
  { key: "UnattendedReply", labelKey: "notifications.unattendedReply" },
  { key: "CommentCreated", labelKey: "notifications.commentCreated" },
  // For the team: a mention arrives instead of the comment, on each channel turned on here
  { key: "Mentioned", labelKey: "notifications.mentioned" },
  { key: "TransferRequest", labelKey: "notifications.transferRequest" },
  // In-app only: tells whoever invited someone that the link stopped working
  { key: "InvitationExpired", labelKey: "notifications.invitationExpired", inAppOnly: true, noMatrix: true },
] as const;

const EMAIL_ONLY_KEYS = [
  { key: "emailCsatSurvey", labelKey: "notifications.csatSurvey" },
] as const;

export default function NotificationsSection() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { upgradeNotificationsEnabled } = useContext(ConfigContext);
  const showUpgrade = !!user?.isSystemAdmin && upgradeNotificationsEnabled;
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  // Null while loading, or when it cannot be read: the page works without Matrix
  const [matrix, setMatrix] = useState<MyMatrixDto | null>(null);
  // Empty while loading or when they cannot be read: the ticket notices still work
  const [notices, setNotices] = useState<NoticeSetting[]>([]);

  const loadMatrix = () => getMyMatrix().then(setMatrix).catch(() => setMatrix(null));

  useEffect(() => {
    getPreferences().then(setPrefs);
    void loadMatrix();
    getNoticePreferences().then(setNotices).catch(() => setNotices([]));
  }, []);

  if (!prefs) return null;

  // Matrix is offered when a bot can write for one of the user's workspaces, or an account is already connected
  const showMatrix = !!matrix && (matrix.available || !!matrix.identity);
  const matrixVerified = matrix?.identity?.status === "verified";
  // The team sees the channel even with no bot yet, locked, so they know it exists; customers never see it
  const showMatrixChannel = showMatrix || !!matrix?.setup;
  const matrixOn = showMatrix && matrixVerified && prefs.matrixEnabled;

  const handleChange = async (key: string, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      await updatePreferences({ [key]: value });
    } catch {
      setPrefs(prefs);
      toast.error("Failed to update preferences");
    }
  };

  const handleNoticeChange = async (kind: string, channel: NoticeChannel, enabled: boolean) => {
    const before = notices;
    setNotices(notices.map((n) => (n.key === kind ? { ...n, channels: { ...n.channels, [channel]: { ...n.channels[channel], enabled } } } : n)));
    try {
      await updateNoticePreference(kind, channel, enabled);
    } catch {
      setNotices(before);
      toast.error("Failed to update preferences");
    }
  };

  return (
    <div className="w-full max-w-lg">
    {showMatrix && matrix && (
      <MatrixAccountCard
        matrix={matrix}
        onChange={(identity) => setMatrix({ ...matrix, identity })}
        onChatsChange={() => void loadMatrix()}
        onVerified={() => { if (!prefs.matrixEnabled) void handleChange("matrixEnabled", true); }}
      />
    )}
    {/* No bot yet: the team learns the channel exists and what it is missing */}
    {!showMatrix && matrix?.setup && <MatrixSetupCard setup={matrix.setup} />}
    <Card className="p-5">
      <p className="text-sm font-body-semibold text-heading mb-5">
        {t("notifications.preferences")}
      </p>

      {/* Channels */}
      <div className={clsx("grid gap-3 mb-5", showMatrixChannel ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2")}>
        <ChannelCard
          id="email"
          title={t("notifications.emailEnabled")}
          description={t("notifications.emailDesc")}
          checked={prefs.emailEnabled}
          onChange={(v) => handleChange("emailEnabled", v)}
        />
        <ChannelCard
          id="in-app"
          title={t("notifications.inAppEnabled")}
          description={t("notifications.inAppDesc")}
          checked={prefs.inAppEnabled}
          onChange={(v) => handleChange("inAppEnabled", v)}
        />
        {showMatrixChannel && (
          <ChannelCard
            id="matrix"
            title={t("notifications.matrixEnabled")}
            description={t(!showMatrix ? "notifications.matrixNeedsBot" : matrixVerified ? "notifications.matrixDesc" : "notifications.matrixNeedsAccount")}
            checked={matrixOn}
            disabled={!matrixVerified}
            focusableWhenDisabled
            onChange={(v) => handleChange("matrixEnabled", v)}
          />
        )}
      </div>

      {prefs.inAppEnabled && (
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-body">
            {t("notifications.bellUnreadOnly")}
          </span>
          <Switch
            checked={prefs.bellUnreadOnly}
            onChange={(v) => handleChange("bellUnreadOnly", v)}
            label={t("notifications.bellUnreadOnly")}
          />
        </div>
      )}

      {/* Event matrix */}
      {(prefs.emailEnabled || prefs.inAppEnabled || matrixOn) && (
        <div>
          <p className="text-xs text-subtle font-body-medium mb-3">
            {t("notifications.events")}
          </p>

          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="flex-1" />
            {prefs.emailEnabled && (
              <span className="w-14 text-center text-exs text-subtle font-body-medium">
                {t("notifications.emailEnabled")}
              </span>
            )}
            {prefs.inAppEnabled && (
              <span className="w-14 text-center text-exs text-subtle font-body-medium">
                {t("notifications.inAppEnabled")}
              </span>
            )}
            {matrixOn && (
              <span className="w-14 text-center text-exs text-subtle font-body-medium">
                {t("notifications.matrixEnabled")}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border-card divide-y divide-border-card">
            {EVENT_KEYS.map(({ key, labelKey, ...rest }) => (
              <div key={key} className="flex items-center gap-2 px-3 py-2.5">
                <span className="flex-1 text-xs text-body">{t(labelKey)}</span>
                {prefs.emailEnabled && ("inAppOnly" in rest ? (
                  <div className="w-14" />
                ) : (
                  <div className="w-14 flex justify-center">
                    <Switch
                      checked={prefs[`email${key}` as keyof NotificationPreferences] as boolean}
                      onChange={(v) => handleChange(`email${key}`, v)}
                      label={`${t(labelKey)} · ${t("notifications.emailEnabled")}`}
                    />
                  </div>
                ))}
                {prefs.inAppEnabled && (
                  <div className="w-14 flex justify-center">
                    <Switch
                      checked={prefs[`inApp${key}` as keyof NotificationPreferences] as boolean}
                      onChange={(v) => handleChange(`inApp${key}`, v)}
                      label={`${t(labelKey)} · ${t("notifications.inAppEnabled")}`}
                    />
                  </div>
                )}
                {matrixOn && ("noMatrix" in rest ? (
                  <div className="w-14" />
                ) : (
                  <div className="w-14 flex justify-center">
                    <Switch
                      checked={prefs[`matrix${key}` as keyof NotificationPreferences] as boolean}
                      onChange={(v) => handleChange(`matrix${key}`, v)}
                      label={`${t(labelKey)} · ${t("notifications.matrixEnabled")}`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {showUpgrade && (
            <>
              <p className="text-xs text-subtle font-body-medium mb-2 mt-4">
                {t("notifications.system")}
              </p>
              <div className="rounded-lg border border-border-card divide-y divide-border-card">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="flex-1 text-xs text-body">{t("notifications.upgradeAvailable")}</span>
                  {prefs.emailEnabled && (
                    <div className="w-14 flex justify-center">
                      <Switch
                        checked={prefs.emailUpgradeAvailable}
                        onChange={(v) => handleChange("emailUpgradeAvailable", v)}
                        label={`${t("notifications.upgradeAvailable")} · ${t("notifications.emailEnabled")}`}
                      />
                    </div>
                  )}
                  {prefs.inAppEnabled && (
                    <div className="w-14 flex justify-center">
                      <Switch
                        checked={prefs.inAppUpgradeAvailable}
                        onChange={(v) => handleChange("inAppUpgradeAvailable", v)}
                        label={`${t("notifications.upgradeAvailable")} · ${t("notifications.inAppEnabled")}`}
                      />
                    </div>
                  )}
                  {/* Not a ticket: there is no Matrix notice for it */}
                  {matrixOn && <div className="w-14" />}
                </div>
              </div>
            </>
          )}

          <NoticePreferenceRows
            notices={notices}
            columns={{ email: prefs.emailEnabled, inApp: prefs.inAppEnabled, matrix: matrixOn }}
            onChange={(kind, channel, enabled) => void handleNoticeChange(kind, channel, enabled)}
          />

          {prefs.emailEnabled && EMAIL_ONLY_KEYS.length > 0 && (
            <>
              <p className="text-xs text-subtle font-body-medium mb-2 mt-4">
                {t("notifications.emailOnly")}
              </p>
              <div className="rounded-lg border border-border-card divide-y divide-border-card">
                {EMAIL_ONLY_KEYS.map(({ key, labelKey }) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2.5">
                    <span className="flex-1 text-xs text-body">{t(labelKey)}</span>
                    <div className="w-14 flex justify-center">
                      <Switch
                        checked={prefs[key as keyof NotificationPreferences] as boolean}
                        onChange={(v) => handleChange(key, v)}
                        label={`${t(labelKey)} · ${t("notifications.emailEnabled")}`}
                      />
                    </div>
                    {/* Under the Email column, like every other row */}
                    {prefs.inAppEnabled && <div className="w-14" />}
                    {matrixOn && <div className="w-14" />}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
    </div>
  );
}

interface ChannelCardProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  /** Disabled but still reached with Tab, so its description tells why. */
  focusableWhenDisabled?: boolean;
  onChange: (value: boolean) => void;
}

/**
 * One channel: the switch is the only control, named by the title and explained by the description;
 * a click anywhere on the card toggles it too, for the mouse (no button inside a button).
 */
function ChannelCard({ id, title, description, checked, disabled, focusableWhenDisabled, onChange }: ChannelCardProps) {
  const titleId = `channel-${id}-title`;
  const descriptionId = `channel-${id}-desc`;
  return (
    <div
      onClick={() => { if (!disabled) onChange(!checked); }}
      className={clsx(
        "rounded-lg border p-3 text-left transition-colors",
        disabled
          ? "border-border-card cursor-not-allowed"
          : checked
            ? "border-primary bg-primary/5 cursor-pointer"
            : "border-border-card hover:border-border-input cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span id={titleId} className="text-sm font-body-medium text-heading">{title}</span>
        <Switch checked={checked} disabled={disabled} focusableWhenDisabled={focusableWhenDisabled} onChange={onChange} labelledBy={titleId} describedBy={descriptionId} />
      </div>
      <p id={descriptionId} className="text-exs text-muted leading-snug">{description}</p>
    </div>
  );
}
