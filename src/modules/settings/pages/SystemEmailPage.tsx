import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
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
  const [showSheet, setShowSheet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getSystemEmail()
      .then((res) => {
        setSender(res.settings);
        setEnvConfigured(res.envConfigured);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    try {
      await deleteSystemEmail();
      setSender(null);
      setConfirmDelete(false);
      toast.success(t("systemEmail.deleted"));
    } catch {
      toast.error(t("systemEmail.deleteError"));
    }
  };

  if (loading) return null;

  const isConfigured = !!sender;

  const content = (
    <div className="space-y-3">
      {!isConfigured && (
        <p className={`text-xs italic ${envConfigured ? "text-muted" : "text-danger"}`}>
          {envConfigured ? t("systemEmail.envActive") : t("systemEmail.noEmailConfigured")}
        </p>
      )}

      {isConfigured ? (
        <div className="flex items-center justify-between p-3 bg-surface-active rounded-lg">
          <div>
            <p className="text-sm text-body font-body-medium">{sender.smtpFrom}</p>
            <p className="text-exs text-muted">{sender.smtpHost}:{sender.smtpPort}</p>
          </div>
          <div className="flex gap-2">
            <Button size="xs" color="light" onClick={() => setShowSheet(true)}>
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
      ) : (
        <Button size="xs" color="light" onClick={() => setShowSheet(true)}>
          {t("emailSender.configure")}
        </Button>
      )}

      {showSheet && (
        <Sheet onClose={() => setShowSheet(false)}>
          <SystemEmailForm
            sender={sender}
            onSaved={(updated) => { setSender(updated); setShowSheet(false); }}
            onCancel={() => setShowSheet(false)}
          />
        </Sheet>
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

function SystemEmailForm({ sender, onSaved, onCancel }: {
  sender: SystemEmailDto | null;
  onSaved: (s: SystemEmailDto | null) => void;
  onCancel: () => void;
}) {
  const isEdit = !!sender;
  const { t } = useTranslation();

  const [smtpLogin, setSmtpLogin] = useState(sender?.smtpUser || "");
  const [smtpFrom, setSmtpFrom] = useState(sender?.smtpFrom || "");
  const [password, setPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState(sender?.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(String(sender?.smtpPort ?? "587"));
  const [encryption, setEncryption] = useState(sender?.encryption ?? "tls");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const resolvedHost = smtpHost || deriveSmtpHost(smtpLogin);
  const resolvedPort = Number(smtpPort) || 587;

  useEffect(() => {
    setTestResult(null);
  }, [smtpLogin, password, smtpHost, smtpPort, encryption]);

  const canTest = smtpLogin.trim() && resolvedHost && (password || isEdit);
  const canSave = canTest && (testResult?.success || isEdit);

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
      setTestResult({ success: false, error: t("systemEmail.testFailed") });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
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
      onSaved(updated.settings);
    } catch {
      toast.error(t("systemEmail.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-body-bold text-heading mb-1">{t("systemEmail.title")}</h2>
      <p className="text-sm text-muted mb-6">{t("systemEmail.description")}</p>

      <form onSubmit={handleSave} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
        {/* Section 1: Sender Address */}
        <p className="text-xs font-body-semibold text-heading mb-3">{t("emailSender.senderIdentity")}</p>
        <p className="text-exs text-muted mb-3">{t("emailSender.senderIdentityDesc")}</p>
        <FormInput label={t("emailSender.fromEmail")}>
          <Input value={smtpFrom} onChange={setSmtpFrom} placeholder={smtpLogin || "noreply@company.com"} type="email" />
        </FormInput>

        <div className="border-t border-border-card my-4" />

        {/* Section 2: Authentication */}
        <p className="text-xs font-body-semibold text-heading mb-3">{t("emailSender.smtpAuth")}</p>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label={t("emailSender.smtpUser")} required>
            <Input value={smtpLogin} onChange={setSmtpLogin} placeholder="user@company.com" />
          </FormInput>
          <FormInput label={t("emailSender.password")} required={!isEdit}>
            <Input value={password} onChange={setPassword} placeholder={isEdit ? "••••••••" : ""} type="password" />
          </FormInput>
        </div>

        <div className="border-t border-border-card my-4" />

        {/* Section 3: Server Settings */}
        <p className="text-xs font-body-semibold text-heading mb-3">{t("emailSender.serverSettings")}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormInput label={t("emailSender.smtpHost")}>
              <Input value={smtpHost} onChange={setSmtpHost} placeholder={deriveSmtpHost(smtpLogin) || "smtp.example.com"} />
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

        <div className="flex items-center gap-3 mb-4">
          <Button size="xs" type="button" color="light" onClick={handleTest} loading={testing} disabled={!canTest}>
            {t("emailSender.test")}
          </Button>
          {testResult && (
            <span className={`text-xs font-body-medium ${testResult.success ? "text-green-600" : "text-red-500"}`}>
              {testResult.success ? t("systemEmail.testSuccess") : testResult.error || t("systemEmail.testFailed")}
            </span>
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
