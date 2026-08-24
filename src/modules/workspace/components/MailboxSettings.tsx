import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [systemMailboxEnabled, setSystemMailboxEnabled] = useState(true);

  useEffect(() => {
    listMailboxes(slug).then(setMailboxes).catch(() => {});
    const refresh = setInterval(() => {
      listMailboxes(slug).then(setMailboxes).catch(() => {});
    }, 5000);
    return () => clearInterval(refresh);
  }, [slug]);

  useEffect(() => {
    getWorkspace(slug).then((ws) => setSystemMailboxEnabled(ws.systemMailboxEnabled)).catch(() => {});
  }, [slug]);

  const webhookMailbox = mailboxes.find((m) => m.type === "webhook");

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
      <div className="flex justify-end mb-3">
        <Button size="xs" color="light" onClick={() => setShowSheet(true)}>
          {t("mailbox.connectMailbox")}
        </Button>
      </div>

      {mailboxes.length === 0 ? (
        <p className="text-xs text-muted">{t("mailbox.empty")}</p>
      ) : (
        <div className="space-y-2">
          {mailboxes.map((m) => {
            const isDefault = m.type === "webhook";
            const active = isDefault ? systemMailboxEnabled : m.isActive;
            return (
            <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isDefault ? (active ? "bg-green-500" : "bg-gray-400") : mailboxStatusColor(m)}`} />
                <div className="min-w-0">
                  <p className="text-xs font-body-medium text-body break-all">{m.address}</p>
                  <p className="text-exs text-muted">
                    {isDefault
                      ? (active ? t("mailbox.systemMailboxDesc") : t("mailbox.paused"))
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
              {isDefault ? (
                <ActionMenu
                  items={[
                    {
                      label: active ? t("mailbox.pause") : t("mailbox.resume"),
                      onClick: handleToggleSystemMailbox,
                    },
                  ]}
                />
              ) : (
                <ActionMenu
                  items={[
                    { label: t("common.edit"), onClick: () => { setEditMailbox(m); setShowSheet(true); } },
                    {
                      label: t("mailbox.pollNow"),
                      onClick: async () => {
                        const toastId = toast.info(t("mailbox.pollingNow"), { autoClose: false });
                        try {
                          const result = await pollMailboxNow(slug, m.id);
                          toast.update(toastId, { render: t("mailbox.importDone").replace("{processed}", String(result.processed)).replace("{rejected}", String(result.rejected)).replace("{total}", String(result.total)), type: "success", autoClose: 5000 });
                          const updated = await listMailboxes(slug);
                          setMailboxes(updated);
                        } catch {
                          toast.update(toastId, { render: t("mailbox.importError"), type: "error", autoClose: 5000 });
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
                        const toastId = toast.info(t("mailbox.importStarted"), { autoClose: false });
                        try {
                          const result = await importMailboxEmails(slug, m.id);
                          toast.update(toastId, { render: t("mailbox.importDone").replace("{processed}", String(result.processed)).replace("{rejected}", String(result.rejected)).replace("{total}", String(result.total)), type: "success", autoClose: 5000 });
                        } catch {
                          toast.update(toastId, { render: t("mailbox.importError"), type: "error", autoClose: 5000 });
                        }
                      },
                    },
                    { label: t("common.delete"), onClick: () => setDeleteId(m.id), danger: true },
                  ]}
                />
              )}
            </div>
            );
          })}
        </div>
      )}

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

const ADDRESS_MODES = [
  { value: "address" as const, labelKey: "mailbox.addressModeAddress", descKey: "mailbox.addressModeAddressDesc" },
  { value: "aliases" as const, labelKey: "mailbox.addressModeAliases", descKey: "mailbox.addressModeAliasesDesc" },
  { value: "all" as const, labelKey: "mailbox.addressModeAll", descKey: "mailbox.addressModeAllDesc" },
];

function AddressModePicker({ value, onChange, t }: {
  value: string;
  onChange: (v: 'address' | 'aliases' | 'all') => void;
  t: (key: any) => string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const selected = ADDRESS_MODES.find((m) => m.value === value) ?? ADDRESS_MODES[0];

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handle = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handle);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <div className="mb-4">
      <p className="text-xs font-body-semibold text-heading mb-1.5">{t("mailbox.addressMode")}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left bg-surface border border-border-card rounded px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors relative"
      >
        <span className="text-sm text-body font-body-medium">{t(selected.labelKey)}</span>
        <span className="text-exs text-muted block mt-0.5">{t(selected.descKey)}</span>
        <svg className="absolute right-3 top-3 text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="bg-surface border border-border-card rounded-lg shadow-lg overflow-hidden"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
        >
          {ADDRESS_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => { onChange(mode.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 cursor-pointer transition-colors ${
                mode.value === value ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-surface-hover border-l-2 border-transparent"
              }`}
            >
              <span className="text-sm text-body font-body-medium">{t(mode.labelKey)}</span>
              <span className="text-exs text-muted block mt-0.5">{t(mode.descKey)}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export function MailboxForm({ slug, mailbox, onSaved, onPlanLimit }: { slug: string; mailbox: MailboxDto | null; onSaved: () => void; onPlanLimit: (err: unknown) => boolean }) {
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

        <AddressModePicker
          value={addressMode}
          onChange={setAddressMode}
          t={t}
        />

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
            {isEdit ? t("mailbox.save") : t("mailbox.add")}
          </Button>
        </div>
      </form>
    </div>
  );
}
