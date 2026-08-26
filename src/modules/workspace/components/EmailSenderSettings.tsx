import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import useExtensions from "@modules/app/extensions/useExtensions";
import {
  EmailSenderDto,
  getEmailSender,
  saveEmailSender,
  deleteEmailSender,
  testEmailSender,
} from "../services/email-sender.service";

interface Props {
  slug: string;
}

function deriveSmtpHost(email: string): string {
  const domain = email.split("@")[1];
  if (!domain) return "";
  const known: Record<string, string> = {
    "gmail.com": "smtp.gmail.com",
    "outlook.com": "smtp.office365.com",
    "hotmail.com": "smtp.office365.com",
    "live.com": "smtp.office365.com",
    "yahoo.com": "smtp.mail.yahoo.com",
    "zoho.com": "smtp.zoho.com",
  };
  return known[domain] || `smtp.${domain}`;
}

export default function EmailSenderSettings({ slug }: Props) {
  const { t } = useTranslation();
  const { emailConfigured, systemEmailFrom } = useConfig();
  const { isPlanLimitError, PlanGate } = useExtensions();
  const [sender, setSender] = useState<EmailSenderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [locked, setLocked] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [smtpLogin, setSmtpLogin] = useState("");
  const [password, setPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [encryption, setEncryption] = useState("tls");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    getEmailSender(slug)
      .then((s) => {
        setSender(s);
        if (s) {
          setSmtpLogin(s.smtpUser);
          setSmtpHost(s.smtpHost);
          setSmtpPort(String(s.smtpPort));
          setEncryption(s.encryption ?? "tls");
          setFromName(s.fromName || "");
          setFromEmail(s.fromEmail || "");
        }
      })
      .catch((err) => {
        if (isPlanLimitError(err)) setLocked(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const resolvedHost = smtpHost || deriveSmtpHost(smtpLogin);
  const resolvedPort = Number(smtpPort) || 587;

  useEffect(() => {
    setTestResult(null);
  }, [smtpLogin, password, smtpHost, smtpPort, encryption]);

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
    } catch {
      setTestResult({ success: false, error: "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
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
      setSender(updated);
      setEditing(false);
      setPassword("");
    } catch {
      toast.error(t("emailSender.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmailSender(slug);
      setSender(null);
      setSmtpLogin("");
      setPassword("");
      setSmtpHost("");
      setSmtpPort("587");
      setFromName("");
      setFromEmail("");
      setEncryption("tls");
      setEditing(false);
      setConfirmDelete(false);
      toast.success(t("emailSender.deleted"));
    } catch {
      toast.error(t("emailSender.deleteError"));
    }
  };

  if (loading) return null;
  if (locked) return <PlanGate message={t("emailSender.enterpriseOnly")} />;

  const isConfigured = !!sender;
  const showForm = editing || !isConfigured;
  const canSave = smtpLogin.trim() && resolvedHost && (password || isConfigured) && (testResult?.success || isConfigured);

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

      {isConfigured && !editing && (
        <div className="flex items-center justify-between p-3 bg-surface-active rounded-lg">
          <div>
            <p className="text-sm text-body font-body-medium">
              {sender.fromName ? `${sender.fromName} <${sender.fromEmail || sender.smtpFrom}>` : sender.smtpFrom}
            </p>
            <p className="text-exs text-muted">{sender.smtpHost}:{sender.smtpPort}</p>
          </div>
          <div className="flex gap-2">
            <Button size="xs" color="light" onClick={() => setEditing(true)}>{t("tickets.edit")}</Button>
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
      )}

      {showForm && (
        <div className="space-y-3">
          {/* Section 1: Sender Identity */}
          <p className="text-xs font-body-semibold text-heading">{t("emailSender.senderIdentity")}</p>
          <p className="text-exs text-muted -mt-2">{t("emailSender.senderIdentityDesc")}</p>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label={t("emailSender.fromName")}>
              <Input value={fromName} onChange={setFromName} size="sm" placeholder="IT Support" />
            </FormInput>
            <FormInput label={t("emailSender.fromEmail")}>
              <Input value={fromEmail} onChange={setFromEmail} size="sm" placeholder={smtpLogin || "support@company.com"} type="email" />
            </FormInput>
          </div>

          <div className="border-t border-border-card my-1" />

          {/* Section 2: Authentication */}
          <p className="text-xs font-body-semibold text-heading">{t("emailSender.smtpAuth")}</p>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label={t("emailSender.smtpUser")}>
              <Input value={smtpLogin} onChange={setSmtpLogin} size="sm" placeholder="user@company.com" />
            </FormInput>
            <FormInput label={t("emailSender.password")}>
              <Input value={password} onChange={setPassword} size="sm" placeholder={isConfigured ? "••••••••" : ""} type="password" />
            </FormInput>
          </div>

          <div className="border-t border-border-card my-1" />

          {/* Section 3: Server Settings */}
          <p className="text-xs font-body-semibold text-heading">{t("emailSender.serverSettings")}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormInput label={t("emailSender.smtpHost")}>
                <Input value={smtpHost} onChange={setSmtpHost} size="sm" placeholder={deriveSmtpHost(smtpLogin) || "smtp.example.com"} />
              </FormInput>
            </div>
            <FormInput label={t("emailSender.smtpPort")}>
              <Input value={smtpPort} onChange={setSmtpPort} size="sm" placeholder="587" />
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

          {testResult && (
            <p className={`text-xs ${testResult.success ? "text-green-600" : "text-red-500"}`}>
              {testResult.success ? t("emailSender.testSuccess") : `${t("emailSender.testFailed")}: ${testResult.error}`}
            </p>
          )}

          {!testResult && !isConfigured && (
            <p className="text-exs text-muted">{t("emailSender.testRequired")}</p>
          )}

          <div className="flex gap-2">
            <Button size="xs" color="light" onClick={handleTest} loading={testing} disabled={!smtpLogin || !resolvedHost || (!password && !isConfigured)}>
              {t("emailSender.test")}
            </Button>
            <Button size="xs" color="primary" onClick={handleSave} loading={saving} disabled={!canSave}>
              {t("settings.save")}
            </Button>
            {editing && (
              <Button size="xs" color="light" onClick={() => { setEditing(false); setPassword(""); setTestResult(null); }}>
                {t("ticketDetail.cancel")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
