import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import {
  MailboxDto,
  listMailboxes,
  createMailbox,
  updateMailbox,
  deleteMailbox,
  testMailboxConnection,
  importMailboxEmails,
  pollMailboxNow,
  pauseMailbox,
  resumeMailbox,
} from "../services/mailbox.service";
import { getWorkspace, toggleSystemMailbox } from "../services/workspace.service";
import { getSystemMailbox } from "@modules/admin/services/system-mailbox.service";

function mailboxStatusColor(m: MailboxDto): string {
  if (m.type === "webhook") return "bg-green-500";
  if (!m.isActive) return "bg-gray-400";
  if (m.lastError) return "bg-red-500";
  if (m.lastSyncAt) return "bg-green-500";
  return "bg-yellow-500";
}

function NextPollCountdown({ lastSyncAt, pollInterval, lastSyncDuration, t }: { lastSyncAt: string; pollInterval: number; lastSyncDuration?: number | null; t: (key: any) => string }) {
  const [now, setNow] = useState(Date.now());
  const fmt = useFormatDate();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lastSyncAt]);

  const lastSync = new Date(lastSyncAt).getTime();
  const nextPoll = lastSync + pollInterval * 1000;
  const remaining = Math.max(0, Math.ceil((nextPoll - now) / 1000));
  const durationStr = lastSyncDuration != null ? `${(lastSyncDuration / 1000).toFixed(1)}s` : null;

  const lastStr = fmt(lastSyncAt);

  if (remaining <= 0) return <span>{t("mailbox.pollingNow")}</span>;
  return <span>{t("mailbox.lastPoll")} {lastStr}{durationStr ? ` · ${t("mailbox.took")} ${durationStr}` : ""} · {t("mailbox.nextIn")} {remaining}s</span>;
}

interface Props {
  slug: string;
}

export default function MailboxSettings({ slug }: Props) {
  const { t } = useTranslation();
  const { handlePlanLimitError } = useExtensions();
  const [mailboxes, setMailboxes] = useState<MailboxDto[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [editMailbox, setEditMailbox] = useState<MailboxDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hasSystemMailbox, setHasSystemMailbox] = useState(false);
  const [systemMailboxActive, setSystemMailboxActive] = useState(true);
  const [systemMailboxEnabled, setSystemMailboxEnabled] = useState(true);

  useEffect(() => {
    listMailboxes(slug).then(setMailboxes).catch(() => {});
    const refresh = setInterval(() => {
      listMailboxes(slug).then(setMailboxes).catch(() => {});
    }, 5000);
    return () => clearInterval(refresh);
  }, [slug]);

  useEffect(() => {
    getSystemMailbox().then((sm) => {
      setHasSystemMailbox(!!sm);
      setSystemMailboxActive(sm?.isActive ?? true);
    }).catch(() => {});
    getWorkspace(slug).then((ws) => setSystemMailboxEnabled(ws.systemMailboxEnabled)).catch(() => {});
  }, [slug]);

  const handleToggleSystemMailbox = async () => {
    const newValue = !systemMailboxEnabled;
    setSystemMailboxEnabled(newValue);
    try {
      await toggleSystemMailbox(slug, newValue);
    } catch {
      setSystemMailboxEnabled(!newValue);
      toast.error(t("mailbox.createError"));
    }
  };

  const handleSaved = async () => {
    const updated = await listMailboxes(slug);
    setMailboxes(updated);
    setShowSheet(false);
    setEditMailbox(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMailbox(slug, deleteId);
      setMailboxes((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
      toast.success(t("mailbox.deleted"));
    } catch {
      toast.error(t("mailbox.deleteError"));
    }
  };

  return (
    <div>
      {hasSystemMailbox && (() => {
        const webhookMailbox = mailboxes.find((m) => m.type === "webhook");
        return (
        <div className="flex items-center justify-between p-3 bg-surface-active rounded-lg mb-4">
          <div>
            <p className="text-sm text-body font-body-medium">{t("mailbox.systemMailbox")}</p>
            {webhookMailbox && (
              <p className="text-xs text-body mt-0.5">{webhookMailbox.address}</p>
            )}
            <p className="text-exs text-muted mt-0.5">
              {!systemMailboxActive
                ? t("mailbox.systemMailboxPaused")
                : t("mailbox.systemMailboxDesc")}
            </p>
          </div>
          {systemMailboxActive ? (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemMailboxEnabled}
                onChange={handleToggleSystemMailbox}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-checked:bg-primary rounded-full peer-focus:ring-2 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          ) : (
            <span className="text-xs text-yellow-600 font-body-medium">{t("mailbox.paused")}</span>
          )}
        </div>
        );
      })()}

      <div className="flex justify-end mb-3">
        <Button size="xs" color="light" onClick={() => setShowSheet(true)}>
          {t("mailbox.connectMailbox")}
        </Button>
      </div>

      {(() => {
        const imapMailboxes = mailboxes.filter((m) => m.type === "imap");
        return imapMailboxes.length === 0 ? (
        <p className="text-xs text-muted">{t("mailbox.empty")}</p>
      ) : (
        <div className="space-y-2">
          {imapMailboxes.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${mailboxStatusColor(m)}`} />
                <div className="min-w-0">
                  <p className="text-xs font-body-medium text-body break-all">{m.address}</p>
                  <p className="text-exs text-muted">
                    {m.type === "webhook"
                      ? t("mailbox.typeWebhook")
                      : !m.isActive
                        ? `IMAP · ${t("mailbox.paused")}`
                        : m.lastError
                          ? m.lastError
                          : m.isActive && m.lastSyncAt
                            ? <span>IMAP · <NextPollCountdown lastSyncAt={m.lastSyncAt} pollInterval={m.pollInterval ?? 30} lastSyncDuration={m.lastSyncDuration} t={t} /></span>
                            : `IMAP · ${t("mailbox.waitingFirstPoll")}`}
                  </p>
                </div>
              </div>
              {m.type === "imap" && (
                <ActionMenu
                  items={[
                    { label: t("common.edit"), onClick: () => { setEditMailbox(m); setShowSheet(true); } },
                    {
                      label: t("mailbox.pollNow"),
                      onClick: async () => {
                        try {
                          toast.info(t("mailbox.pollingNow"));
                          const result = await pollMailboxNow(slug, m.id);
                          toast.success(t("mailbox.importDone").replace("{processed}", String(result.processed)).replace("{total}", String(result.total)));
                          const updated = await listMailboxes(slug);
                          setMailboxes(updated);
                        } catch {
                          toast.error(t("mailbox.importError"));
                        }
                      },
                    },
                    {
                      label: m.isActive ? t("mailbox.pause") : t("mailbox.resume"),
                      onClick: async () => {
                        try {
                          if (m.isActive) {
                            await pauseMailbox(slug, m.id);
                            setMailboxes((prev) => prev.map((mb) => mb.id === m.id ? { ...mb, isActive: false } : mb));
                          } else {
                            await resumeMailbox(slug, m.id);
                            setMailboxes((prev) => prev.map((mb) => mb.id === m.id ? { ...mb, isActive: true, lastSyncAt: null } : mb));
                          }
                          const updated = await listMailboxes(slug);
                          setMailboxes(updated);
                        } catch {
                          toast.error(t("mailbox.createError"));
                        }
                      },
                    },
                    {
                      label: t("mailbox.import"),
                      onClick: async () => {
                        try {
                          toast.info(t("mailbox.importStarted"));
                          const result = await importMailboxEmails(slug, m.id);
                          toast.success(t("mailbox.importDone").replace("{processed}", String(result.processed)).replace("{total}", String(result.total)));
                        } catch {
                          toast.error(t("mailbox.importError"));
                        }
                      },
                    },
                    { label: t("common.delete"), onClick: () => setDeleteId(m.id), danger: true },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      );
      })()}

      {showSheet && (
        <Sheet onClose={() => { setShowSheet(false); setEditMailbox(null); }}>
          <MailboxForm slug={slug} mailbox={editMailbox} onSaved={handleSaved} onPlanLimit={handlePlanLimitError} />
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("mailbox.deleteTitle")}
          message={t("mailbox.deleteMessage")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

function MailboxForm({ slug, mailbox, onSaved, onPlanLimit }: { slug: string; mailbox: MailboxDto | null; onSaved: () => void; onPlanLimit: (err: unknown) => boolean }) {
  const isEdit = !!mailbox;
  const { t } = useTranslation();
  const [address, setAddress] = useState(mailbox?.address ?? "");
  const [imapHost, setImapHost] = useState(mailbox?.imapHost ?? "");
  const [imapPort, setImapPort] = useState(String(mailbox?.imapPort ?? "993"));
  const [imapUser, setImapUser] = useState(mailbox?.imapUser ?? "");
  const [imapPass, setImapPass] = useState("");
  const [imapFolder, setImapFolder] = useState(mailbox?.imapFolder ?? "INBOX");
  const [encryption, setEncryption] = useState(mailbox?.encryption ?? "tls");
  const [pollInterval, setPollInterval] = useState(String(mailbox?.pollInterval ?? "30"));

  const [addressMode, setAddressMode] = useState<'address' | 'aliases' | 'all'>(
    (mailbox?.addressMode as 'address' | 'aliases' | 'all') ?? 'address'
  );
  const [acceptedAddresses, setAcceptedAddresses] = useState<string[]>(
    mailbox?.acceptedAddresses ?? []
  );
  const [autoReply, setAutoReply] = useState(mailbox?.autoReply ?? true);
  const [newAddress, setNewAddress] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const canTest = imapHost.trim() && imapUser.trim() && (imapPass.trim() || isEdit);
  const canSave = address.trim() && canTest && (testResult?.success || isEdit);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testMailboxConnection(slug, {
        imapHost: imapHost.trim(),
        imapPort: parseInt(imapPort) || 993,
        imapUser: imapUser.trim(),
        imapPass: imapPass || "__keep__",
        encryption,
        ...(isEdit && mailbox ? { mailboxId: mailbox.id } : {}),
      });
      setTestResult({ success: result.success, error: result.error });
      if (result.success && result.folders.length > 0) {
        setFolders(result.folders);
        if (!result.folders.includes(imapFolder)) {
          setImapFolder(result.folders[0]);
        }
      }
    } catch {
      setTestResult({ success: false, error: "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    try {
      if (isEdit) {
        await updateMailbox(slug, mailbox!.id, {
          address: address.trim(),
          imapHost: imapHost.trim(),
          imapPort: parseInt(imapPort) || 993,
          imapUser: imapUser.trim(),
          ...(imapPass.trim() && { imapPass: imapPass }),
          encryption,
          imapFolder: imapFolder.trim() || "INBOX",
          pollInterval: parseInt(pollInterval) || 30,
          addressMode,
          acceptedAddresses,
          autoReply,
        });
      } else {
        await createMailbox(slug, {
          address: address.trim(),
          imapHost: imapHost.trim(),
          imapPort: parseInt(imapPort) || 993,
          imapUser: imapUser.trim(),
          imapPass: imapPass,
          encryption,
          imapFolder: imapFolder.trim() || "INBOX",
          pollInterval: parseInt(pollInterval) || 30,
          addressMode,
          acceptedAddresses,
          autoReply,
        });
      }
      toast.success(isEdit ? t("mailbox.updated") : t("mailbox.created"));
      onSaved();
    } catch (err: unknown) {
      if (onPlanLimit(err)) return;
      const error = err as { message?: string };
      toast.error(error.message || t("mailbox.createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-body-bold text-heading mb-1">{isEdit ? t("mailbox.editImap") : t("mailbox.connectMailbox")}</h2>
      <p className="text-sm text-muted mb-6">{t("mailbox.addImapDesc")}</p>

      <form onSubmit={handleSave} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
        <FormInput label={t("mailbox.address")} required>
          <Input placeholder="support@example.com" value={address} onChange={setAddress} />
        </FormInput>

        <div className="border-t border-border-card my-4" />

        <p className="text-xs font-body-semibold text-heading mb-3">{t("mailbox.imapSettings")}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormInput label={t("mailbox.imapHost")} required>
              <Input placeholder="imap.example.com" value={imapHost} onChange={setImapHost} />
            </FormInput>
          </div>
          <FormInput label={t("mailbox.imapPort")}>
            <Input value={imapPort} onChange={setImapPort} />
          </FormInput>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormInput label={t("mailbox.imapUser")} required>
            <Input placeholder="support@example.com" value={imapUser} onChange={setImapUser} />
          </FormInput>
          <FormInput label={t("mailbox.imapPass")} required={!isEdit}>
            <Input type="password" placeholder={isEdit ? t("mailbox.keepPassword") : ""} value={imapPass} onChange={setImapPass} />
          </FormInput>
        </div>

        <FormInput label={t("mailbox.encryption")}>
          <Select
            options={['tls', 'tls-insecure', 'none']}
            label={(e) => t(`mailbox.encryption.${e}` as any)}
            value={(e) => e === encryption}
            onChange={setEncryption}
          />
        </FormInput>

        <div className="flex items-center gap-3 mb-4">
          <Button size="xs" type="button" color="light" onClick={handleTest} loading={testing} disabled={!canTest}>
            {t("mailbox.testConnection")}
          </Button>
          {testResult && (
            <span className={`text-xs font-body-medium ${testResult.success ? "text-green-600" : "text-red-500"}`}>
              {testResult.success ? t("mailbox.testSuccess") : testResult.error || t("mailbox.testFailed")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {folders.length > 0 && (
            <FormInput label={t("mailbox.folder")}>
              <Select
                options={folders}
                label={(f) => f}
                value={(f) => f === imapFolder}
                onChange={setImapFolder}
              />
            </FormInput>
          )}
          <FormInput label={t("mailbox.pollInterval")}>
            <Input value={pollInterval} onChange={setPollInterval} />
          </FormInput>
        </div>

        <div className="border-t border-border-card my-4" />

        <p className="text-xs font-body-semibold text-heading mb-3">{t("mailbox.addressMode")}</p>

        <div className="flex flex-col gap-2 mb-3">
          <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
            <input
              type="radio"
              name="addressMode"
              checked={addressMode === 'address'}
              onChange={() => setAddressMode('address')}
              className="accent-primary"
            />
            {t("mailbox.addressModeAddress")}
          </label>
          <p className="text-exs text-muted ml-6 mb-1">{t("mailbox.addressModeAddressDesc")}</p>
          <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
            <input
              type="radio"
              name="addressMode"
              checked={addressMode === 'aliases'}
              onChange={() => setAddressMode('aliases')}
              className="accent-primary"
            />
            {t("mailbox.addressModeAliases")}
          </label>
          <p className="text-exs text-muted ml-6 mb-1">{t("mailbox.addressModeAliasesDesc")}</p>
          <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
            <input
              type="radio"
              name="addressMode"
              checked={addressMode === 'all'}
              onChange={() => setAddressMode('all')}
              className="accent-primary"
            />
            {t("mailbox.addressModeAll")}
          </label>
          <p className="text-exs text-muted ml-6 mb-1">{t("mailbox.addressModeAllDesc")}</p>
        </div>

        {addressMode === 'aliases' && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                {address || '...'}
              </span>
              {acceptedAddresses.map((addr) => (
                <span key={addr} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-hover border border-border-card text-xs text-body">
                  {addr}
                  <button
                    type="button"
                    className="text-muted hover:text-red-500 ml-0.5 cursor-pointer"
                    onClick={() => setAcceptedAddresses((prev) => prev.filter((a) => a !== addr))}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const trimmed = newAddress.trim().toLowerCase();
                  if (trimmed && trimmed.includes('@') && !acceptedAddresses.includes(trimmed) && trimmed !== address.trim().toLowerCase()) {
                    setAcceptedAddresses((prev) => [...prev, trimmed]);
                    setNewAddress('');
                  }
                }
              }}>
                <Input
                  placeholder="alias@example.com"
                  value={newAddress}
                  onChange={setNewAddress}
                />
              </div>
              <Button
                size="xs"
                type="button"
                color="light"
                onClick={() => {
                  const trimmed = newAddress.trim().toLowerCase();
                  if (trimmed && trimmed.includes('@') && !acceptedAddresses.includes(trimmed) && trimmed !== address.trim().toLowerCase()) {
                    setAcceptedAddresses((prev) => [...prev, trimmed]);
                    setNewAddress('');
                  }
                }}
              >
                {t("mailbox.addAddress")}
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-border-card my-4" />
        <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
          <input
            type="checkbox"
            checked={autoReply}
            onChange={(e) => setAutoReply(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          {t("mailbox.autoReply")}
        </label>
        <p className="text-exs text-muted mt-1 mb-4">{t("mailbox.autoReplyDesc")}</p>

        <div className="mt-4">
          <Button size="sm" type="submit" full loading={saving} disabled={!canSave}>
            {t("mailbox.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
