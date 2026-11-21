import { useState } from "react";
import { toast } from "react-toastify";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import useTranslation from "@modules/app/i18n/useTranslation";
import { ConnectMatrixBotRequest, ConnectedMatrixBotDto, MatrixBotDto } from "../services/matrix.service";

interface Props {
  connect: (body: ConnectMatrixBotRequest) => Promise<ConnectedMatrixBotDto>;
  onConnected: (bot: MatrixBotDto) => void;
  /** The bot connected now, when changing it: shown above the form, and its ID typed in. */
  current?: { userId: string; homeserverUrl: string; label: string } | null;
  /** Closes the form without connecting; absent when the page has nothing else to show instead. */
  onCancel?: () => void;
}

/**
 * Signs a bot in once: the password (or a token) goes to the server, which keeps only the token.
 * It sits in the page itself, in a box, so connecting a bot never leaves the Matrix settings.
 */
export default function MatrixBotForm({ connect, onConnected, current = null, onCancel }: Props) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState(current?.userId ?? "");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [withToken, setWithToken] = useState(false);
  const [homeserverUrl, setHomeserverUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secret = withToken ? accessToken.trim() : password;
  const canSave = /^@[^:\s]+:\S+$/.test(userId.trim()) && !!secret;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const { bot, handOver } = await connect({
        userId: userId.trim(),
        ...(withToken ? { accessToken: accessToken.trim() } : { password }),
        ...(homeserverUrl.trim() && { homeserverUrl: homeserverUrl.trim() }),
      });
      toast.success(t("matrix.connected"));
      if (handOver && handOver.moved > 0) toast.info(t(handOver.moved === 1 ? "matrix.handedOverOne" : "matrix.handedOver").replace("{count}", String(handOver.moved)));
      if (handOver && handOver.notMoved.length > 0) {
        toast.warning(t("matrix.notHandedOver").replace("{bot}", bot.userId).replace("{rooms}", handOver.notMoved.map((r) => r.roomId).join(", ")), { autoClose: false });
      }
      onConnected(bot);
    } catch (err) {
      const e = err as HttpResponseError;
      setError(e.code === "matrix-https-required" ? t("matrix.httpsRequired") : e.message || t("matrix.connectError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border-card p-4">
      <h4 className="text-sm font-body-semibold text-heading mb-1">{t(current ? "matrix.changeBotTitle" : "matrix.connectBotTitle")}</h4>
      <p className="text-xs text-muted mb-4">{t(current ? "matrix.changeBotDescription" : "matrix.connectBotDescription")}</p>

      {current && (
        <div className="mb-5 px-3 py-2.5 rounded-lg border border-border-card bg-surface-active">
          <p className="text-exs text-muted mb-0.5">{t("matrix.currentBot")}</p>
          <p className="text-sm text-body font-body-medium truncate">{current.userId}</p>
          <p className="text-exs text-muted truncate">{current.label} · {current.homeserverUrl}</p>
          <p className="text-exs text-amber-700 dark:text-amber-300 mt-2">{t("matrix.changeBotRooms")}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormInput label={t("matrix.userId")} required>
          <Input value={userId} onChange={setUserId} placeholder="@helpdesk:example.org" autoComplete="off" />
        </FormInput>
        {withToken ? (
          <FormInput label={t("matrix.accessToken")} required>
            <Input value={accessToken} onChange={setAccessToken} type="password" autoComplete="off" />
          </FormInput>
        ) : (
          <FormInput label={t("matrix.password")} required>
            {/* The bot's password, never the helpdesk's own: the browser must not fill it in */}
            <Input value={password} onChange={setPassword} type="password" autoComplete="new-password" />
          </FormInput>
        )}
        <button type="button" className="text-exs text-primary hover:underline -mt-2 mb-4 cursor-pointer" onClick={() => setWithToken(!withToken)}>
          {withToken ? t("matrix.usePassword") : t("matrix.useToken")}
        </button>
        <FormInput label={t("matrix.homeserverUrl")}>
          <Input value={homeserverUrl} onChange={setHomeserverUrl} placeholder="https://matrix.example.org" />
          <p className="text-exs text-subtle mt-1">{t("matrix.homeserverUrlHint")}</p>
        </FormInput>

        {error && <p className="text-xs text-red-600 dark:text-red-400 mb-3" role="alert">{error}</p>}

        <div className="flex justify-end gap-2">
          {onCancel && <Button size="sm" color="light" type="button" onClick={onCancel} disabled={saving}>{t("common.cancel")}</Button>}
          <Button size="sm" type="submit" loading={saving} disabled={!canSave}>
            {t(current ? "matrix.changeBot" : "matrix.connectBot")}
          </Button>
        </div>
      </form>
    </div>
  );
}
