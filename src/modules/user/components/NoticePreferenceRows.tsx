import Switch from "@modules/app/modules/ui/components/Switch/Switch";
import useTranslation from "@modules/app/i18n/useTranslation";
import { NoticeChannel, NoticeSetting } from "@modules/notification/domain/notification";
import { noticeLabel } from "@modules/notification/domain/notification-display";

interface Props {
  notices: NoticeSetting[];
  /** The channels shown as columns, as in the ticket notices above */
  columns: Record<NoticeChannel, boolean>;
  onChange: (kind: string, channel: NoticeChannel, enabled: boolean) => void;
}

const ORDER: NoticeChannel[] = ["email", "inApp", "matrix"];
const CHANNEL_LABELS: Record<NoticeChannel, string> = {
  email: "notifications.emailEnabled",
  inApp: "notifications.inAppEnabled",
  matrix: "notifications.matrixEnabled",
};

/**
 * The notices that are not about a ticket (someone joined the team…), as the server lists them:
 * the core's and an extension's alike. A channel that cannot be turned off shows on and locked.
 */
export default function NoticePreferenceRows({ notices, columns, onChange }: Props) {
  const { t, lang } = useTranslation();
  if (notices.length === 0) return null;

  return (
    <>
      <p className="text-xs text-subtle font-body-medium mb-2 mt-4">{t("notifications.notices")}</p>
      <div className="rounded-lg border border-border-card divide-y divide-border-card">
        {notices.map((notice) => {
          const label = noticeLabel(notice.label, lang);
          return (
            <div key={notice.key} className="flex items-center gap-2 px-3 py-2.5">
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-body">{label}</span>
                <span className="block text-exs text-muted leading-snug">{noticeLabel(notice.description, lang)}</span>
              </span>
              {ORDER.filter((channel) => columns[channel]).map((channel) => {
                const { enabled, mandatory } = notice.channels[channel];
                return (
                  <div key={channel} className="w-14 flex justify-center" title={mandatory ? t("notifications.mandatory") : undefined}>
                    <Switch
                      checked={enabled}
                      disabled={mandatory}
                      onChange={(value) => onChange(notice.key, channel, value)}
                      label={`${label} · ${t(CHANNEL_LABELS[channel] as never)}${mandatory ? ` · ${t("notifications.mandatory")}` : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
