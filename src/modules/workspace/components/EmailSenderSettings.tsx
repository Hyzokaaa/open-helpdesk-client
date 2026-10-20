import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import ConnectionTestResult, { ConnectionTestOutcome } from "@modules/workspace/components/ConnectionTestResult";
import { savedPasswordApplies } from "@modules/workspace/domain/saved-password";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import useExtensions from "@modules/app/extensions/useExtensions";
import useMailServerField from "@modules/shared/hooks/useMailServerField";
import {
  EmailSenderDto,
  getEmailSender,
  saveEmailSender,
  deleteEmailSender,
  testEmailSender,
  resolveMailServer,
} from "../services/email-sender.service";

interface Props {
  slug: string;
}

export default function EmailSenderSettings({ slug }: Props) {
  const { t } = useTranslation();
  const { emailConfigured, systemEmailFrom } = useConfig();
  const { isPlanLimitError, PlanGate } = useExtensions();
  const [sender, setSender] = useState<EmailSenderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [locked, setLocked] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const isDirtyRef = useRef(false);

  const handleSheetClose = () => {
    if (isDirtyRef.current) {
      setShowDiscard(true);
    } else {
      setShowSheet(false);
    }
  };

  useEffect(() => {
    getEmailSender(slug)
      .then(setSender)
      .catch((err) => {
        if (isPlanLimitError(err)) setLocked(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    try {
      await deleteEmailSender(slug);
      setSender(null);
      setConfirmDelete(false);
      toast.success(t("emailSender.deleted"));
    } catch {
      toast.error(t("emailSender.deleteError"));
    }
  };

  if (loading) return null;
  if (locked) return <PlanGate message={t("emailSender.enterpriseOnly")} />;

  const isConfigured = !!sender;

  return (
    <div className="space-y-3">
      {!isConfigured && emailConfigured && systemEmailFrom && (
        <div className="flex items-center gap-2.5 p-3 bg-surface-active rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <div>
            <p className="text-xs text-body font-body-medium">{systemEmailFrom}</p>
            <p className="text-exs text-muted">{t("emailSender.usingSystem")}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        {isConfigured
          ? t("emailSender.activeDescription")
          : emailConfigured
            ? t("emailSender.description")
            : t("emailSender.noGlobalDescription")}
      </p>

      {isConfigured ? (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface">
          <div>
            <p className="text-sm text-body font-body-medium">
              {sender.fromName ? `${sender.fromName} <${sender.fromEmail || sender.smtpFrom}>` : sender.smtpFrom}
            </p>
            <p className="text-exs text-muted">{sender.smtpHost}:{sender.smtpPort}</p>
          </div>
          <div className="flex gap-2">
            <Button size="xs" color="light" onClick={() => setShowSheet(true)}>{t("tickets.edit")}</Button>
            {confirmDelete ? (
              <>
                <Button size="xs" color="danger" onClick={handleDelete}>{t("emailSender.confirmDelete")}</Button>
                <Button size="xs" color="light" onClick={() => setConfirmDelete(false)}>{t("ticketDetail.cancel")}</Button>
              </>
            ) : (
              <Button size="xs" color="danger" onClick={() => setConfirmDelete(true)}>{t("tickets.delete")}</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button size="xs" color="light" onClick={() => setShowSheet(true)}>
            {t("emailSender.configure")}
          </Button>
        </div>
      )}

      {showSheet && (
        <Sheet onClose={handleSheetClose}>
          <EmailSenderForm
            slug={slug}
            sender={sender}
            onSaved={(updated) => { setSender(updated); setShowSheet(false); }}
            onCancel={handleSheetClose}
            onDirtyChange={(d) => { isDirtyRef.current = d; }}
          />
        </Sheet>
      )}

      {showDiscard && (
        <ConfirmModal
          title={t("discard.title")}
          message={t("discard.message")}
          confirmLabel={t("discard.confirm")}
          danger
          onConfirm={() => { setShowDiscard(false); setShowSheet(false); }}
          onCancel={() => setShowDiscard(false)}
        />
      )}
    </div>
  );
}

function EmailSenderForm({ slug, sender, onSaved, onCancel, onDirtyChange }: {
  slug: string;
  sender: EmailSenderDto | null;
  onSaved: (s: EmailSenderDto | null) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const isEdit = !!sender;
  const { t } = useTranslation();

  const [fromName, setFromName] = useState(sender?.fromName || "");
  const [fromEmail, setFromEmail] = useState(sender?.fromEmail || "");
  const [smtpLogin, setSmtpLogin] = useState(sender?.smtpUser || "");
  const [password, setPassword] = useState("");
  // Host and port follow the login's domain unless typed (see useMailServerField)
  const server = useMailServerField({
    address: smtpLogin,
    kind: "smtp",
    resolve: (domain) => resolveMailServer(slug, domain),
    saved: sender ? { address: sender.smtpUser, host: sender.smtpHost, port: sender.smtpPort } : undefined,
  });
  const { host: smtpHost, setHost: setSmtpHost, port: smtpPort, setPort: setSmtpPort } = server;
  const [encryption, setEncryption] = useState(sender?.encryption ?? "tls");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestOutcome | null>(null);

  const isDirty = isEdit
    ? fromName !== (sender?.fromName || "") || fromEmail !== (sender?.fromEmail || "") || smtpLogin !== (sender?.smtpUser || "") || password !== "" || smtpHost !== (sender?.smtpHost || "") || smtpPort !== String(sender?.smtpPort ?? "587") || encryption !== (sender?.encryption ?? "tls")
    : smtpLogin.trim() !== "" || password.trim() !== "";

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty]);

  const resolvedHost = smtpHost.trim();
  // An empty password field means the saved one only while the server and user stay the same
  const keepsSavedPassword = savedPasswordApplies(sender && { host: sender.smtpHost, user: sender.smtpUser }, { host: resolvedHost, user: smtpLogin });
  const resolvedPort = Number(smtpPort) || 587;

  useEffect(() => {
    setTestResult(null);
  }, [smtpLogin, password, smtpHost, smtpPort, encryption]);

  const canTest = smtpLogin.trim() && resolvedHost && (password || keepsSavedPassword);
  const canSave = canTest && (testResult?.success || isEdit);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testEmailSender(slug, {
        smtpHost: resolvedHost,
        smtpPort: resolvedPort,
        smtpUser: smtpLogin,
        smtpPass: password || "__keep__",
        encryption,
      });
      setTestResult(result);
    } catch (err) {
      // A refused request (validation, permission, plan, server down) says why; that is what to show
      setTestResult({ success: false, error: (err as HttpResponseError).message || t("emailSender.testFailed") });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await saveEmailSender(slug, {
        smtpHost: resolvedHost,
        smtpPort: resolvedPort,
        smtpUser: smtpLogin,
        smtpPass: password,
        smtpFrom: smtpLogin,
        encryption,
        fromName: fromName || null,
        fromEmail: fromEmail || null,
      });
      toast.success(t("emailSender.saved"));
      const updated = await getEmailSender(slug);
      onSaved(updated);
    } catch {
      toast.error(t("emailSender.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-body-bold text-heading mb-1">
        {isEdit ? t("emailSender.editTitle") : t("emailSender.configure")}
      </h2>
      <p className="text-sm text-muted mb-6">{t(isEdit ? "emailSender.activeDescription" : "emailSender.description")}</p>

      <form onSubmit={handleSave} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
        {/* Section 1: Sender Identity */}
        <p className="text-xs font-body-semibold text-heading mb-3">{t("emailSender.senderIdentity")}</p>
        <p className="text-exs text-muted mb-3">{t("emailSender.senderIdentityDesc")}</p>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label={t("emailSender.fromName")}>
            <Input value={fromName} onChange={setFromName} placeholder="IT Support" />
          </FormInput>
          <FormInput label={t("emailSender.fromEmail")}>
            <Input value={fromEmail} onChange={setFromEmail} placeholder={smtpLogin || "support@company.com"} type="email" />
          </FormInput>
        </div>

        <div className="border-t border-border-card my-4" />

        {/* Section 2: Authentication */}
        <p className="text-xs font-body-semibold text-heading mb-3">{t("emailSender.smtpAuth")}</p>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label={t("emailSender.smtpUser")} required>
            <Input value={smtpLogin} onChange={setSmtpLogin} placeholder="user@company.com" />
          </FormInput>
          <FormInput label={t("emailSender.password")} required={!keepsSavedPassword}>
            <Input value={password} onChange={setPassword} placeholder={keepsSavedPassword ? t("savedPassword.placeholder") : ""} type="password" />
            {isEdit && !keepsSavedPassword && !password && <p className="text-exs text-amber-700 dark:text-amber-300 mt-1">{t("savedPassword.changed")}</p>}
          </FormInput>
        </div>

        <div className="border-t border-border-card my-4" />

        {/* Section 3: Server Settings */}
        <p className="text-xs font-body-semibold text-heading mb-3">{t("emailSender.serverSettings")}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormInput label={t("emailSender.smtpHost")}>
              <Input value={smtpHost} onChange={setSmtpHost} placeholder="smtp.example.com" />
              {server.note && <p className="text-exs text-subtle mt-1">{server.note}</p>}
            </FormInput>
          </div>
          <FormInput label={t("emailSender.smtpPort")}>
            <Input value={smtpPort} onChange={setSmtpPort} placeholder="587" />
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
        {/* A password sent in plain text can be read by anyone on the way: allowed for a server on your own network, never silently */}
        {encryption === "none" && (password || isEdit) && (
          <p className="text-exs text-amber-700 dark:text-amber-300 -mt-2 mb-3">{t("emailSender.plainPasswordWarning")}</p>
        )}

        <div className="flex items-center gap-3 mb-4">
          <Button size="xs" type="button" color="light" onClick={handleTest} loading={testing} disabled={!canTest}>
            {t("emailSender.test")}
          </Button>
          {testResult && (
            <ConnectionTestResult result={testResult} protocol="smtp" host={resolvedHost} port={smtpPort} successText={t("emailSender.testSuccess")} failedText={t("emailSender.testFailed")} />
          )}
          {!testResult && !isEdit && (
            <span className="text-exs text-muted">{t("emailSender.testRequired")}</span>
          )}
        </div>

        <div className="mt-4">
          <Button size="sm" type="submit" full loading={saving} disabled={!canSave}>
            {t("settings.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
