import { useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  setCustomDomain,
  verifyCustomDomain,
  DomainVerificationResult,
} from "../services/workspace.service";

interface Props {
  slug: string;
  currentDomain: string | null;
  verified: boolean;
  verificationToken: string | null;
  cnameTarget: string;
  saasMode: boolean;
  onUpdate: (domain: string | null, verified: boolean, token: string | null, cnameTarget?: string) => void;
}

export default function CustomDomainSettings({ slug, currentDomain, verified, verificationToken, cnameTarget, saasMode, onUpdate }: Props) {
  const { t } = useTranslation();
  const [domain, setDomain] = useState(currentDomain ?? "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<DomainVerificationResult | null>(null);
  const [activeCnameTarget, setActiveCnameTarget] = useState(cnameTarget);

  const hasChanges = domain.trim().toLowerCase() !== (currentDomain ?? "");
  const hasDomain = !!currentDomain;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await setCustomDomain(slug, domain.trim() || null, !saasMode);
      if (res.cnameTarget) setActiveCnameTarget(res.cnameTarget);
      onUpdate(res.customDomain, res.customDomainVerified, res.domainVerificationToken);
      setResult(null);
      toast.success(res.customDomain ? t("customDomain.saved") : t("customDomain.removed"));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t("customDomain.saveError");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyCustomDomain(slug);
      setResult(res);
      if (res.verified) {
        onUpdate(currentDomain, true, verificationToken);
        toast.success(t("customDomain.verified"));
      }
    } catch {
      toast.error(t("customDomain.verifyError"));
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await setCustomDomain(slug, null);
      setDomain("");
      setResult(null);
      onUpdate(null, false, null);
      toast.success(t("customDomain.removed"));
    } catch {
      toast.error(t("customDomain.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        {saasMode ? t("customDomain.descSaas") : t("customDomain.descSelfhosted")}
      </p>

      <div className="flex items-end gap-2">
        <FormInput label={t("customDomain.label")} className="flex-1 !mb-0">
          <Input
            value={domain}
            onChange={setDomain}
            size="sm"
            placeholder="helpdesk.yourcompany.com"
          />
        </FormInput>
        <Button size="xs" color="primary" onClick={handleSave} loading={saving} disabled={!hasChanges && hasDomain}>
          {hasDomain && !hasChanges ? t("customDomain.saved") : t("settings.save")}
        </Button>
      </div>

      {hasDomain && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {saasMode && (
              <StatusBadge
                label={verified ? t("customDomain.verified") : t("customDomain.pending")}
                color={verified ? "green" : "yellow"}
                size="xs"
              />
            )}
            {saasMode && !verified && (
              <Button size="xs" color="light" onClick={handleVerify} loading={verifying}>
                {t("customDomain.verify")}
              </Button>
            )}
            <Button size="xs" color="danger" onClick={handleRemove} loading={saving}>
              {t("customDomain.remove")}
            </Button>
          </div>

          {/* SaaS: DNS verification instructions */}
          {saasMode && !verified && verificationToken && (
            <div className="bg-surface-hover rounded-lg p-3 space-y-2">
              <p className="text-xs font-body-medium text-heading">{t("customDomain.dnsInstructions")}</p>
              <div className="space-y-1.5">
                <div className="text-xs">
                  <span className="text-subtle">1. {t("customDomain.dnsRecord")}</span>
                  <div className="font-mono text-xs bg-surface p-1.5 rounded mt-0.5 text-body">
                    CNAME {currentDomain} → {result?.cnameTarget ?? activeCnameTarget}
                    {result && (
                      <StatusBadge label={result.dnsValid ? "OK" : "Missing"} color={result.dnsValid ? "green" : "red"} size="xs" />
                    )}
                  </div>
                  <p className="text-exs text-muted mt-0.5">{t("customDomain.dnsRecordHint")}</p>
                </div>
                <div className="text-xs">
                  <span className="text-subtle">2. TXT</span>
                  <div className="font-mono text-xs bg-surface p-1.5 rounded mt-0.5 text-body break-all">
                    _oh-verify.{currentDomain} → {verificationToken}
                    {result && (
                      <StatusBadge label={result.txtValid ? "OK" : "Missing"} color={result.txtValid ? "green" : "red"} size="xs" />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-exs text-muted">{t("customDomain.dnsPropagation")}</p>
            </div>
          )}

          {/* Selfhosted: simple reminder */}
          {!saasMode && (
            <div className="bg-surface-hover rounded-lg p-3">
              <p className="text-xs text-muted">{t("customDomain.proxyReminder")}</p>
            </div>
          )}

          {/* Routing info */}
          {(verified || !saasMode) && (
            <div className="bg-surface-hover rounded-lg p-3 space-y-1.5">
              <p className="text-exs font-body-semibold text-subtle uppercase tracking-wider">{t("customDomain.routing")}</p>
              <div className="flex items-center gap-2 text-xs">
                <code className="text-exs text-primary bg-primary/5 px-1.5 py-0.5 rounded font-body-medium">{currentDomain}/</code>
                <span className="text-muted">→</span>
                <span className="text-body">{t("routing.portal")} {t("customDomain.thisWorkspace")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <code className="text-exs text-primary bg-primary/5 px-1.5 py-0.5 rounded font-body-medium">{currentDomain}/dashboard</code>
                <span className="text-muted">→</span>
                <span className="text-body">{t("routing.agentDashboard")}</span>
              </div>
              <a href={`https://${currentDomain}`} target="_blank" rel="noopener noreferrer" className="text-exs text-primary hover:underline inline-block mt-1">
                {t("customDomain.openPortal")} →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
