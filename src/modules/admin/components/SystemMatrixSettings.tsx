import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import Button from "@modules/app/modules/ui/components/Button/Button";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import MatrixBotForm from "@modules/workspace/components/MatrixBotForm";
import { MatrixBotDto, connectSystemMatrixBot, disconnectSystemMatrixBot, getSystemMatrixBot } from "@modules/workspace/services/matrix.service";

/** The installation's Matrix bot: the one workspaces without their own write their notices with. */
export default function SystemMatrixSettings() {
  const { t } = useTranslation();
  const [bot, setBot] = useState<MatrixBotDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    getSystemMatrixBot().then(setBot).finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const handleDisconnect = async () => {
    setConfirmDisconnect(false);
    try {
      const { sessionEnded } = await disconnectSystemMatrixBot();
      setBot(null);
      toast.success(t(sessionEnded ? "matrix.disconnected" : "matrix.disconnectedOffline"));
    } catch (err) {
      toast.error((err as HttpResponseError).message);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{t("matrix.installationDescription")}</p>

      {bot ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-card bg-surface">
          <div className="min-w-0">
            <p className="text-sm text-body font-body-medium truncate">{bot.userId}</p>
            <p className="text-exs text-muted truncate">{bot.homeserverUrl}</p>
            {!bot.tokenReadable && <p className="text-exs text-amber-700 dark:text-amber-300 mt-1">{t("matrix.tokenUnreadable")}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="xs" color="light" onClick={() => setEditing(true)} disabled={editing}>{t("tickets.edit")}</Button>
            <Button size="xs" color="danger" onClick={() => setConfirmDisconnect(true)}>{t("matrix.disconnect")}</Button>
          </div>
        </div>
      ) : null}

      {/* With no bot the form is the page; changing one opens it under the bot */}
      {(!bot || editing) && (
        <MatrixBotForm
          key={bot?.userId ?? "new"}
          connect={connectSystemMatrixBot}
          current={bot && { ...bot, label: t("matrix.installationBot") }}
          onConnected={(connected) => { setBot(connected); setEditing(false); }}
          onCancel={bot ? () => setEditing(false) : undefined}
        />
      )}

      {confirmDisconnect && (
        <ConfirmModal
          title={t("matrix.disconnectTitle")}
          message={t("matrix.disconnectMessage")}
          confirmLabel={t("matrix.disconnect")}
          danger
          onConfirm={handleDisconnect}
          onCancel={() => setConfirmDisconnect(false)}
        />
      )}
    </div>
  );
}
