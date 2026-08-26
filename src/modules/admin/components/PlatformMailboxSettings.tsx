import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import {
  SystemMailboxDto,
  getSystemMailbox,
  saveSystemMailbox,
  updateSystemMailbox,
  deleteSystemMailbox,
  testSystemMailboxConnection,
  pauseSystemMailbox,
  resumeSystemMailbox,
} from "../services/system-mailbox.service";

function statusColor(mailbox: SystemMailboxDto): string {
  if (!mailbox.isActive) return "bg-gray-400";
  if (mailbox.lastError) return "bg-red-500";
  if (mailbox.lastSyncAt) return "bg-green-500";
  return "bg-yellow-500";
}

export default function PlatformMailboxSettings() {
  const { t } = useTranslation();
  const fmt = useFormatDate();
  const [loading, setLoading] = useState(true);
  const [mailbox, setMailbox] = useState<SystemMailboxDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = async () => {
    try {
      const data = await getSystemMailbox();
      setMailbox(data);
    } catch {
      setMailbox(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async () => {
    try {
      await deleteSystemMailbox();
      setMailbox(null);
      setShowDelete(false);
      toast.success(t("platformMailbox.deleted"));
    } catch {
      toast.error(t("mailbox.deleteError"));
    }
  };

  if (loading) return <Spinner />;

  if (!mailbox && !showForm) {
    return (
      <div>
        <p className="text-xs text-muted mb-3">{t("platformMailbox.description")}</p>
        <p className="text-xs text-muted mb-3">{t("platformMailbox.notConfigured")}</p>
        <Button size="xs" color="light" onClick={() => setShowForm(true)}>
          {t("platformMailbox.configure")}
        </Button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <p className="text-xs text-muted mb-4">{t("platformMailbox.description")}</p>
        <MailboxForm
          mailbox={mailbox}
          onSaved={(updated) => {
            setMailbox(updated);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted mb-3">{t("platformMailbox.description")}</p>

      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor(mailbox!)}`} />
          <div className="min-w-0">
            <p className="text-xs font-body-medium text-body break-all">{mailbox!.address}</p>
            <p className="text-exs text-muted">
              {mailbox!.imapHost}:{mailbox!.imapPort}
              {!mailbox!.isActive && ` · ${t("mailbox.paused")}`}
              {mailbox!.lastError && ` · ${mailbox!.lastError}`}
              {mailbox!.isActive && mailbox!.lastSyncAt && !mailbox!.lastError && ` · ${t("mailbox.lastPoll")} ${fmt(mailbox!.lastSyncAt)}`}
              {mailbox!.isActive && !mailbox!.lastSyncAt && !mailbox!.lastError && ` · ${t("mailbox.waitingFirstPoll")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mailbox!.isActive ? (
            <Button size="xs" color="light" onClick={async () => {
              await pauseSystemMailbox();
              const updated = await getSystemMailbox();
              setMailbox(updated);
            }}>
              {t("mailbox.pause")}
            </Button>
          ) : (
            <Button size="xs" color="light" onClick={async () => {
              await resumeSystemMailbox();
              const updated = await getSystemMailbox();
              setMailbox(updated);
            }}>
              {t("mailbox.resume")}
            </Button>
          )}
          <Button size="xs" color="light" onClick={() => setShowForm(true)}>
            {t("common.edit")}
          </Button>
          <div className="w-px h-4 bg-border-card" />
          <Button size="xs" color="danger" onClick={() => setShowDelete(true)}>
            {t("common.delete")}
          </Button>
        </div>
      </div>

      {showDelete && (
        <ConfirmModal
          title={t("common.delete")}
          message={t("platformMailbox.deleteConfirm")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

function MailboxForm({
  mailbox,
  onSaved,
  onCancel,
}: {
  mailbox: SystemMailboxDto | null;
  onSaved: (m: SystemMailboxDto) => void;
  onCancel: () => void;
}) {
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
      const result = await testSystemMailboxConnection({
        imapHost: imapHost.trim(),
        imapPort: parseInt(imapPort) || 993,
        imapUser: imapUser.trim(),
        imapPass: imapPass || "__keep__",
        encryption,
      });
      setTestResult({ success: result.success, error: result.error });
      if (result.success && result.folders && result.folders.length > 0) {
        setFolders(result.folders);
        if (!result.folders.includes(imapFolder)) {
          setImapFolder(result.folders[0]);
        }
      }
    } catch {
      setTestResult({ success: false, error: t("mailbox.testFailed") });
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
        await updateSystemMailbox({
          address: address.trim(),
          imapHost: imapHost.trim(),
          imapPort: parseInt(imapPort) || 993,
          imapUser: imapUser.trim(),
          ...(imapPass.trim() && { imapPass }),
          encryption,
          imapFolder: imapFolder.trim() || "INBOX",
          pollInterval: parseInt(pollInterval) || 30,
        });
        toast.success(t("platformMailbox.updated"));
      } else {
        await saveSystemMailbox({
          address: address.trim(),
          imapHost: imapHost.trim(),
          imapPort: parseInt(imapPort) || 993,
          imapUser: imapUser.trim(),
          imapPass,
          encryption,
          imapFolder: imapFolder.trim() || "INBOX",
          pollInterval: parseInt(pollInterval) || 30,
        });
        toast.success(t("platformMailbox.saved"));
      }
      const updated = await getSystemMailbox();
      onSaved(updated!);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t("mailbox.createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
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
          <Input value={imapPort} onChange={setImapPort} placeholder="993" />
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
          options={["tls", "tls-insecure", "none"]}
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

      <div className="border-t border-border-card my-4" />

      <p className="text-xs font-body-semibold text-heading mb-3">{t("mailbox.pollingSettings")}</p>

      <div className="grid grid-cols-2 gap-3">
        <FormInput label={t("mailbox.folder")}>
          {folders.length > 0 ? (
            <Select
              options={folders}
              label={(f) => f}
              value={(f) => f === imapFolder}
              onChange={setImapFolder}
            />
          ) : (
            <Input value={imapFolder} onChange={setImapFolder} placeholder="INBOX" />
          )}
        </FormInput>
        <FormInput label={`${t("mailbox.pollInterval")} (${t("mailbox.seconds")})`}>
          <Input value={pollInterval} onChange={setPollInterval} placeholder="30" />
        </FormInput>
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" type="submit" full loading={saving} disabled={!canSave}>
          {t("mailbox.save")}
        </Button>
        <Button size="sm" type="button" color="light" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
