import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
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
  const { emailConfigured } = useConfig();
  const { isPlanLimitError, PlanGate } = useExtensions();
  const [sender, setSender] = useState<EmailSenderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [locked, setLocked] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    getEmailSender(slug)
      .then((s) => {
        setSender(s);
        if (s) {
          setEmail(s.smtpFrom);
          setSmtpHost(s.smtpHost);
          setSmtpPort(String(s.smtpPort));
          setSmtpUser(s.smtpUser);
        }
      })
      .catch((err) => {
        if (isPlanLimitError(err)) setLocked(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const resolvedHost = smtpHost || deriveSmtpHost(email);
  const resolvedUser = smtpUser || email;
  const resolvedPort = Number(smtpPort) || 587;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testEmailSender(slug, {
        smtpHost: resolvedHost,
        smtpPort: resolvedPort,
        smtpUser: resolvedUser,
        smtpPass: password || "__keep__",
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
        smtpUser: resolvedUser,
        smtpPass: password,
        smtpFrom: email,
      });
      toast.success(t("emailSender.saved"));
      const updated = await getEmailSender(slug);
      setSender(updated);
      setEditing(false);
      setPassword("");
      setShowAdvanced(false);
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
      setEmail("");
      setPassword("");
      setSmtpHost("");
      setSmtpPort("587");
      setSmtpUser("");
      setEditing(false);
      setShowAdvanced(false);
      toast.success(t("emailSender.deleted"));
    } catch {
      toast.error(t("emailSender.deleteError"));
    }
  };

  if (loading) return null;
  if (locked) return <PlanGate message={t("emailSender.enterpriseOnly")} />;

  const isConfigured = !!sender;
  const showForm = editing || !isConfigured;
  const canSave = email.trim() && resolvedHost && (password || isConfigured);

  return (
    <div className="space-y-3">
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
            <p className="text-sm text-body font-body-medium">{sender.smtpFrom}</p>
            <p className="text-exs text-muted">{sender.smtpHost}:{sender.smtpPort}</p>
          </div>
          <div className="flex gap-2">
            <Button size="xs" color="light" onClick={() => setEditing(true)}>{t("tickets.edit")}</Button>
            <Button size="xs" color="danger" onClick={handleDelete}>{t("tickets.delete")}</Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="space-y-3">
          <FormInput label={t("emailSender.email")}>
            <Input value={email} onChange={setEmail} size="sm" placeholder="support@company.com" />
          </FormInput>

          <FormInput label={t("emailSender.password")}>
            <Input value={password} onChange={setPassword} size="sm" placeholder={isConfigured ? "••••••••" : ""} type="password" />
          </FormInput>

          {email && resolvedHost && (
            <p className="text-exs text-muted">
              {t("emailSender.autoDetected")}: {resolvedHost}:{resolvedPort}
            </p>
          )}

          <button
            type="button"
            className="text-xs text-primary hover:underline cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "▾" : "▸"} {t("emailSender.advanced")}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-3 border-l-2 border-border-input">
              <FormInput label={t("emailSender.smtpHost")}>
                <Input value={smtpHost} onChange={setSmtpHost} size="sm" placeholder={deriveSmtpHost(email) || "smtp.example.com"} />
              </FormInput>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label={t("emailSender.smtpPort")}>
                  <Input value={smtpPort} onChange={setSmtpPort} size="sm" placeholder="587" />
                </FormInput>
                <FormInput label={t("emailSender.smtpUser")}>
                  <Input value={smtpUser} onChange={setSmtpUser} size="sm" placeholder={email || "user@company.com"} />
                </FormInput>
              </div>
            </div>
          )}

          {testResult && (
            <p className={`text-xs ${testResult.success ? "text-green-600" : "text-red-500"}`}>
              {testResult.success ? t("emailSender.testSuccess") : `${t("emailSender.testFailed")}: ${testResult.error}`}
            </p>
          )}

          <div className="flex gap-2">
            <Button size="xs" color="light" onClick={handleTest} loading={testing} disabled={!email || !resolvedHost || (!password && !isConfigured)}>
              {t("emailSender.test")}
            </Button>
            <Button size="xs" color="primary" onClick={handleSave} loading={saving} disabled={!canSave}>
              {t("settings.save")}
            </Button>
            {editing && (
              <Button size="xs" color="light" onClick={() => { setEditing(false); setPassword(""); setTestResult(null); setShowAdvanced(false); }}>
                {t("ticketDetail.cancel")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
