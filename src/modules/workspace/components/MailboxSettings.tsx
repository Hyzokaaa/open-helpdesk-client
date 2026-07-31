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
import {
  MailboxDto,
  listMailboxes,
  createMailbox,
  updateMailbox,
  deleteMailbox,
  testMailboxConnection,
} from "../services/mailbox.service";

function mailboxStatusColor(m: MailboxDto): string {
  if (m.type === "webhook") return "bg-green-500";
  if (m.lastError) return "bg-red-500";
  if (m.lastSyncAt) return "bg-green-500";
  return "bg-gray-400";
}

function formatTimeAgo(dateStr: string, t: (key: any) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("mailbox.justNow");
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
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

  useEffect(() => {
    listMailboxes(slug).then(setMailboxes).catch(() => {});
  }, [slug]);

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
          {mailboxes.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${mailboxStatusColor(m)}`} />
                <div className="min-w-0">
                  <p className="text-xs font-body-medium text-body break-all">{m.address}</p>
                  <p className="text-exs text-muted">
                    {m.type === "webhook"
                      ? t("mailbox.typeWebhook")
                      : m.lastError
                        ? m.lastError
                        : m.lastSyncAt
                          ? `IMAP · ${t("mailbox.lastSync")} ${formatTimeAgo(m.lastSyncAt, t)}`
                          : `IMAP · ${m.imapUser}@${m.imapHost}`}
                  </p>
                </div>
              </div>
              {m.type === "imap" && (
                <ActionMenu
                  items={[
                    { label: t("common.edit"), onClick: () => { setEditMailbox(m); setShowSheet(true); } },
                    { label: t("common.delete"), onClick: () => setDeleteId(m.id), danger: true },
                  ]}
                />
              )}
            </div>
          ))}
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

function MailboxForm({ slug, mailbox, onSaved, onPlanLimit }: { slug: string; mailbox: MailboxDto | null; onSaved: () => void; onPlanLimit: (err: unknown) => boolean }) {
  const isEdit = !!mailbox;
  const { t } = useTranslation();
  const [address, setAddress] = useState(mailbox?.address ?? "");
  const [imapHost, setImapHost] = useState(mailbox?.imapHost ?? "");
  const [imapPort, setImapPort] = useState(String(mailbox?.imapPort ?? "993"));
  const [imapUser, setImapUser] = useState(mailbox?.imapUser ?? "");
  const [imapPass, setImapPass] = useState("");
  const [imapFolder, setImapFolder] = useState(mailbox?.imapFolder ?? "INBOX");
  const [pollInterval, setPollInterval] = useState(String(mailbox?.pollInterval ?? "30"));

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
        imapTls: true,
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
          imapTls: true,
          imapFolder: imapFolder.trim() || "INBOX",
          pollInterval: parseInt(pollInterval) || 30,
        });
      } else {
        await createMailbox(slug, {
          address: address.trim(),
          imapHost: imapHost.trim(),
          imapPort: parseInt(imapPort) || 993,
          imapUser: imapUser.trim(),
          imapPass: imapPass,
          imapTls: true,
          imapFolder: imapFolder.trim() || "INBOX",
          pollInterval: parseInt(pollInterval) || 30,
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

      <form onSubmit={handleSave}>
        <FormInput label={t("mailbox.address")} required>
          <Input placeholder="support@example.com" value={address} onChange={setAddress} />
        </FormInput>

        <div className="border-t border-border-card my-4" />

        <p className="text-xs font-body-semibold text-heading mb-3">{t("mailbox.imapSettings")}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormInput label={t("mailbox.imapHost")} required>
              <Input placeholder="imap.gmail.com" value={imapHost} onChange={setImapHost} />
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

        <div className="mt-4">
          <Button size="sm" type="submit" full loading={saving} disabled={!canSave}>
            {t("mailbox.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
