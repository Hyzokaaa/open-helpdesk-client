import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  SystemEmailDto,
  getSystemEmail,
  saveSystemEmail,
  deleteSystemEmail,
  testSystemEmail,
} from "../services/system-email.service";

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

interface SystemEmailPageProps {
  embedded?: boolean;
}

export default function SystemEmailPage({ embedded }: SystemEmailPageProps = {}) {
  const { t } = useTranslation();
  const [sender, setSender] = useState<SystemEmailDto | null>(null);
  const [envConfigured, setEnvConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [smtpLogin, setSmtpLogin] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [password, setPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [encryption, setEncryption] = useState("tls");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    getSystemEmail()
      .then((res) => {
        setSender(res.settings);
        setEnvConfigured(res.envConfigured);
        if (res.settings) {
          setSmtpLogin(res.settings.smtpUser);
          setSmtpFrom(res.settings.smtpFrom);
          setSmtpHost(res.settings.smtpHost);
          setSmtpPort(String(res.settings.smtpPort));
          setEncryption(res.settings.encryption ?? "tls");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const resolvedHost = smtpHost || deriveSmtpHost(smtpLogin);
  const resolvedPort = Number(smtpPort) || 587;

  useEffect(() => {
    setTestResult(null);
  }, [smtpLogin, password, smtpHost, smtpPort, encryption]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSystemEmail({
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
      await saveSystemEmail({
        smtpHost: resolvedHost,
        smtpPort: resolvedPort,
        smtpUser: smtpLogin,
        smtpPass: password,
        smtpFrom: smtpFrom || smtpLogin,
        encryption,
      });
      toast.success(t("systemEmail.saved"));
      const updated = await getSystemEmail();
      setSender(updated.settings);
      setEditing(false);
      setPassword("");
    } catch {
      toast.error(t("systemEmail.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSystemEmail();
      setSender(null);
      setSmtpLogin("");
      setSmtpFrom("");
      setPassword("");
      setSmtpHost("");
      setSmtpPort("587");
      setEncryption("tls");
      setEditing(false);
      setConfirmDelete(false);
      toast.success(t("systemEmail.deleted"));
    } catch {
      toast.error(t("systemEmail.deleteError"));
    }
  };

  if (loading) return null;

  const isConfigured = !!sender;
  const showForm = editing || !isConfigured;
  const canSave = smtpLogin.trim() && resolvedHost && (password || isConfigured) && (testResult?.success || isConfigured);

  const content = (
      <div className="space-y-3">
        {!isConfigured && !editing && (
          <p className={`text-xs italic ${envConfigured ? "text-muted" : "text-danger"}`}>
            {envConfigured ? t("systemEmail.envActive") : t("systemEmail.noEmailConfigured")}
          </p>
        )}

        {isConfigured && !editing && (
          <div className="flex items-center justify-between p-3 bg-surface-active rounded-lg">
            <div>
              <p className="text-sm text-body font-body-medium">
                {sender.smtpFrom}
              </p>
              <p className="text-exs text-muted">
                {sender.smtpHost}:{sender.smtpPort}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="xs" color="light" onClick={() => setEditing(true)}>
                {t("tickets.edit")}
              </Button>
              {confirmDelete ? (
                <>
                  <Button size="xs" color="danger" onClick={handleDelete}>{t("emailSender.confirmDelete")}</Button>
                  <Button size="xs" color="light" onClick={() => setConfirmDelete(false)}>{t("ticketDetail.cancel")}</Button>
                </>
              ) : (
                <Button size="xs" color="danger" onClick={() => setConfirmDelete(true)}>
                  {t("tickets.delete")}
                </Button>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <div className="space-y-3">
            {/* Section 1: Sender Address */}
            <p className="text-xs font-body-semibold text-heading">{t("emailSender.senderIdentity")}</p>
            <p className="text-exs text-muted -mt-2">{t("emailSender.senderIdentityDesc")}</p>
            <FormInput label={t("emailSender.fromEmail")}>
              <Input value={smtpFrom} onChange={setSmtpFrom} size="sm" placeholder={smtpLogin || "noreply@company.com"} type="email" />
            </FormInput>

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
                {testResult.success
                  ? t("systemEmail.testSuccess")
                  : `${t("systemEmail.testFailed")}: ${testResult.error}`}
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

  if (embedded) return content;

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-lg font-body-bold text-heading mb-1">
        {t("systemEmail.title")}
      </h1>
      <p className="text-xs text-muted mb-4">{t("systemEmail.description")}</p>
      {content}
    </div>
  );
}
