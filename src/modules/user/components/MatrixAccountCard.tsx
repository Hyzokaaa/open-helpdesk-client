import { useEffect, useId, useRef, useState } from "react";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Input from "@modules/app/modules/ui/components/Input/Input";
import useTranslation from "@modules/app/i18n/useTranslation";
import { TranslationKey } from "@modules/app/i18n/translations";
import {
  MatrixAccountDto,
  MatrixChatDto,
  MyMatrixDto,
  cancelMatrixChange,
  disconnectMatrix,
  reconnectMatrixChat,
  sendMatrixCode,
  verifyMatrixCode,
} from "@modules/notification/services/matrix-account.service";

interface Props {
  matrix: MyMatrixDto;
  onChange: (identity: MatrixAccountDto | null) => void;
  /** After a chat was reconnected: the list is read again. */
  onChatsChange: () => void;
  /** Right after the code was accepted: the channel can be turned on. */
  onVerified: () => void;
}

const MATRIX_ID = /^@[^:\s]+:\S+$/;

/** The server's reasons the user can act on, by their stable code, in the user's language. */
const ERRORS: Record<string, TranslationKey> = {
  "matrix-invalid-id": "matrixAccount.invalidId",
  "matrix-unavailable": "matrixAccount.unavailable",
  "matrix-is-bot": "matrixAccount.isBot",
  "matrix-already-connected": "matrixAccount.alreadyConnected",
  "matrix-too-soon": "matrixAccount.tooSoon",
  "matrix-too-many-today": "matrixAccount.tooManyToday",
  "matrix-bot-gone": "matrixAccount.botGone",
  "matrix-unreachable": "matrixAccount.unreachable",
  "matrix-no-code": "matrixAccount.noCode",
  "matrix-code-expired": "matrixAccount.expired",
  "matrix-too-many-wrong": "matrixAccount.tooManyWrong",
  "matrix-wrong-code": "matrixAccount.wrongCode",
  "matrix-busy": "matrixAccount.busy",
  "matrix-not-connected": "matrixAccount.notConnected",
};

/** Where the focus goes after a change of state, so it never falls back to the page. */
type FocusTarget = "title" | "id" | "code" | "confirm" | "disconnect";

/**
 * The user's own Matrix account: they type their ID, the bot invites them to a private chat with a
 * code, and they type it here. Then it lists the bots that may write to them, one chat each, and a
 * chat the user left can be reconnected. Changing a verified ID keeps the notices on it until the
 * new one's code is typed, and can be given up. What happens is said once, visibly and to screen readers
 * (role=status); errors are tied to their field; the focus follows each change.
 */
export default function MatrixAccountCard({ matrix, onChange, onChatsChange, onVerified }: Props) {
  const { t } = useTranslation();
  const ids = { intro: useId(), error: useId(), codeHint: useId(), title: useId(), chats: useId() };
  const identity = matrix.identity;
  const [matrixUserId, setMatrixUserId] = useState(identity?.matrixUserId ?? "");
  const [editingId, setEditingId] = useState(!identity);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const bot = matrix.botUserId ?? "";
  /** The ID whose code is awaited: a new account, or one replacing the verified one. */
  const codeFor = identity?.status === "pending" ? identity.matrixUserId : identity?.pendingMatrixUserId ?? null;
  const changing = identity?.status === "verified" && !!identity.pendingMatrixUserId;

  useEffect(() => {
    if (!focus) return;
    const el = root.current?.querySelector<HTMLElement>(`[data-focus="${focus}"]`);
    (el?.matches("input, button, [tabindex]") ? el : el?.querySelector<HTMLElement>("input, button"))?.focus();
    setFocus(null);
  }, [focus]);

  const failed = (err: unknown, account = matrixUserId.trim()) => {
    const e = err as HttpResponseError;
    const known = e.code ? ERRORS[e.code] : undefined;
    if (known) setError(t(known).replace("{account}", account));
    // The request limit, before the service says anything
    else if (e.status === 429) setError(t("matrixAccount.tooSoon"));
    else setError(t("matrixAccount.error"));
  };

  const run = async (action: () => Promise<void>, account?: string) => {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await action();
    } catch (err) {
      failed(err, account);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (id: string) => {
    const typed = id.trim();
    if (!MATRIX_ID.test(typed)) {
      setError(t("matrixAccount.invalidId"));
      setFocus("id");
      return;
    }
    void run(async () => {
      onChange(await sendMatrixCode(typed));
      setEditingId(false);
      setCode("");
      setNotice(t("matrixAccount.codeSent").replace("{account}", typed));
      setFocus("code");
    }, typed);
  };

  const verify = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("matrixAccount.invalidCode"));
      setFocus("code");
      return;
    }
    void run(async () => {
      onChange(await verifyMatrixCode(code.trim()));
      setCode("");
      setNotice(t("matrixAccount.connected"));
      setFocus("title");
      onVerified();
    });
  };

  const disconnect = () => run(async () => {
    await disconnectMatrix();
    onChange(null);
    setMatrixUserId("");
    setEditingId(true);
    setConfirming(false);
    setNotice(t("matrixAccount.disconnected"));
    setFocus("id");
  });

  const reconnect = (chat: MatrixChatDto) => {
    setReconnecting(chat.botId);
    void run(async () => {
      await reconnectMatrixChat(chat.botId);
      setNotice(t("matrixAccount.reconnected").replace("{bot}", chat.botUserId));
      onChatsChange();
      setFocus("title");
    }, identity?.matrixUserId).finally(() => setReconnecting(null));
  };

  const cancelChange = () => run(async () => {
    const current = identity?.matrixUserId ?? "";
    onChange(await cancelMatrixChange());
    setCode("");
    setNotice(t("matrixAccount.changeCancelled").replace("{current}", current));
    setFocus("title");
  });

  const editId = () => {
    setEditingId(true);
    setError(null);
    setNotice("");
    setFocus("id");
  };

  const cancelEdit = () => {
    if (!identity) return;
    setEditingId(false);
    setMatrixUserId(identity.pendingMatrixUserId ?? identity.matrixUserId);
    setError(null);
    setFocus("title");
  };

  const errorText = error && (
    <p id={ids.error} role="alert" className="text-xs text-red-700 dark:text-red-300 mb-3">{error}</p>
  );

  return (
    <Card className="p-5 mb-4">
      <section aria-labelledby={ids.title} ref={root}>
        <h2 id={ids.title} data-focus="title" tabIndex={-1} className="text-sm font-body-semibold text-heading mb-2 focus:outline-none">{t("matrixAccount.title")}</h2>

        {/* What just happened, seen and heard once; errors are announced on their own (role=alert) */}
        <p role="status" className={notice ? "text-xs text-green-700 dark:text-green-300 mb-3 break-words" : "sr-only"}>{notice}</p>

        {(!identity || editingId) && (
          <form noValidate onSubmit={(e) => { e.preventDefault(); sendCode(matrixUserId); }}>
            <p id={ids.intro} className="text-xs text-muted leading-snug mb-4 break-words">
              {t("matrixAccount.intro").replace("{bot}", bot)}
              {identity?.status === "verified" && <> {t("matrixAccount.idChangeWarning")}</>}
            </p>
            <div data-focus="id">
              <FormInput label={t("matrixAccount.userId")} required>
                <Input
                  value={matrixUserId}
                  onChange={setMatrixUserId}
                  placeholder="@name:example.org"
                  autoComplete="off"
                  describedBy={error ? `${ids.intro} ${ids.error}` : ids.intro}
                  invalid={!!error}
                  required
                />
              </FormInput>
            </div>
            {errorText}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>{t("matrixAccount.sendCode")}</Button>
              {identity && <Button color="light" disabled={busy} onClick={cancelEdit}>{t("common.cancel")}</Button>}
            </div>
          </form>
        )}

        {codeFor && !editingId && (
          <form noValidate onSubmit={(e) => { e.preventDefault(); verify(); }}>
            <p className="text-xs text-body leading-snug mb-4 break-words">
              {(changing ? t("matrixAccount.changePending").replace("{current}", identity!.matrixUserId) : t("matrixAccount.pending"))
                .replace("{bot}", bot)
                .replace("{account}", codeFor)}
            </p>
            <div data-focus="code">
              <FormInput label={t("matrixAccount.code")} required>
                <Input
                  value={code}
                  onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  describedBy={error ? `${ids.codeHint} ${ids.error}` : ids.codeHint}
                  invalid={!!error}
                  required
                />
              </FormInput>
            </div>
            <p id={ids.codeHint} className="text-exs text-muted -mt-3 mb-4">{t("matrixAccount.codeHint")}</p>
            {errorText}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>{t("matrixAccount.verify")}</Button>
              <Button color="light" disabled={busy} onClick={() => sendCode(codeFor)}>{t("matrixAccount.resend")}</Button>
              <Button color="light" disabled={busy} onClick={editId}>{t("matrixAccount.changeId")}</Button>
              {changing && (
                <Button color="light" disabled={busy} onClick={() => void cancelChange()}>
                  {t("matrixAccount.cancelChange").replace("{current}", identity!.matrixUserId)}
                </Button>
              )}
            </div>
          </form>
        )}

        {identity?.status === "verified" && !changing && !editingId && (
          <div>
            <p className="text-xs text-body leading-snug mb-4 break-words">{t("matrixAccount.verified").replace("{account}", identity.matrixUserId)}</p>
            {matrix.chats.length > 0 && (
              <div className="mb-4">
                <h3 id={ids.chats} className="text-xs font-body-semibold text-heading mb-1">{t("matrixAccount.chats")}</h3>
                <p className="text-exs text-muted leading-snug mb-2">{t("matrixAccount.chatsHint")}</p>
                <ul aria-labelledby={ids.chats} className="rounded-lg border border-border-card divide-y divide-border-card">
                  {matrix.chats.map((chat) => (
                    <li key={chat.botId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-body-medium text-body break-all">{chat.botUserId}</p>
                        <p className="text-exs text-muted break-words">
                          {chat.workspaces.length > 0
                            ? t("matrixAccount.chatWorkspaces").replace("{workspaces}", chat.workspaces.join(", "))
                            : t("matrixAccount.chatAllWorkspaces")}
                        </p>
                        {chat.paused && <p className="text-exs text-amber-800 dark:text-amber-200">{t("matrixAccount.chatPaused")}</p>}
                      </div>
                      {chat.paused && (
                        <Button
                          size="xs"
                          color="light"
                          loading={reconnecting === chat.botId}
                          disabled={busy && reconnecting !== chat.botId}
                          ariaLabel={t("matrixAccount.reconnectLabel").replace("{bot}", chat.botUserId)}
                          onClick={() => reconnect(chat)}
                        >
                          {t("matrixAccount.reconnect")}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {errorText}
            {confirming ? (
              <div role="group" aria-label={t("matrixAccount.disconnect")} className="rounded-lg border border-border-card p-3">
                <p className="text-xs text-body mb-3">{t("matrixAccount.disconnectConfirm")}</p>
                <div className="flex flex-wrap gap-2">
                  <span data-focus="confirm"><Button color="danger" loading={busy} onClick={() => void disconnect()}>{t("matrixAccount.disconnect")}</Button></span>
                  <Button color="light" disabled={busy} onClick={() => { setConfirming(false); setFocus("disconnect"); }}>{t("common.cancel")}</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <span data-focus="disconnect"><Button color="light" onClick={() => { setConfirming(true); setFocus("confirm"); }}>{t("matrixAccount.disconnect")}</Button></span>
                <Button color="light" onClick={editId}>{t("matrixAccount.changeId")}</Button>
              </div>
            )}
          </div>
        )}
      </section>
    </Card>
  );
}
