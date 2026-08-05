import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import {
  ApiKeyDto,
  API_KEY_SCOPES,
  listApiKeys,
  createApiKey,
  deleteApiKey,
} from "../services/api-key.service";

interface Props {
  slug: string;
}

export default function ApiKeySettings({ slug }: Props) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const [keys, setKeys] = useState<ApiKeyDto[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    listApiKeys(slug).then(setKeys).catch(() => {});
  }, [slug]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteApiKey(slug, deleteId);
      setKeys((prev) => prev.filter((k) => k.id !== deleteId));
      setDeleteId(null);
      toast.success(t("apiKeys.deleted"));
    } catch {
      toast.error(t("apiKeys.deleteError"));
    }
  };

  const handleCreated = async () => {
    const updated = await listApiKeys(slug);
    setKeys(updated);
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="xs" color="light" onClick={() => setShowCreate(true)}>
          {t("apiKeys.create")}
        </Button>
      </div>

      {keys.length === 0 ? (
        <p className="text-xs text-muted">{t("apiKeys.empty")}</p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => {
            const isExpired = k.expiresAt && new Date(k.expiresAt) < new Date();
            return (
              <div key={k.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface">
                <div className="min-w-0">
                  <p className="text-xs font-body-medium text-body">{k.name}</p>
                  <p className="text-exs text-muted">
                    {k.prefix}... · {k.scopes.length}/{API_KEY_SCOPES.length} {t("apiKeys.scopes")}
                    {k.expiresAt ? (
                      <span className={isExpired ? " text-red-500" : ""}>
                        {" · "}{isExpired ? t("apiKeys.expired") : `${t("apiKeys.expires")} ${formatDate(k.expiresAt)}`}
                      </span>
                    ) : (
                      <span>{" · "}{t("apiKeys.noExpiration")}</span>
                    )}
                    {k.lastUsedAt && ` · ${t("apiKeys.lastUsed")} ${formatDate(k.lastUsedAt)}`}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(k.id)}
                  className="text-xs text-red-500 hover:text-red-600 cursor-pointer shrink-0 ml-3"
                >
                  {t("apiKeys.revoke")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Sheet size="md" onClose={() => setShowCreate(false)}>
          <CreateApiKeyForm slug={slug} onCreated={handleCreated} onClose={() => setShowCreate(false)} />
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("apiKeys.revokeTitle")}
          message={t("apiKeys.revokeMessage")}
          confirmLabel={t("apiKeys.revoke")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

interface ExpirationOption {
  label: string;
  days: number | null;
  recommended?: boolean;
}

function CreateApiKeyForm({ slug, onCreated, onClose }: { slug: string; onCreated: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([...API_KEY_SCOPES]);
  const [expiration, setExpiration] = useState<ExpirationOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const expirationOptions: ExpirationOption[] = [
    { label: t("apiKeys.expiration30"), days: 30 },
    { label: t("apiKeys.expiration60"), days: 60 },
    { label: `${t("apiKeys.expiration90")} (${t("apiKeys.recommended")})`, days: 90, recommended: true },
    { label: t("apiKeys.expiration1y"), days: 365 },
    { label: t("apiKeys.noExpiration"), days: null },
  ];

  // Default to 90 days
  const selectedExpiration = expiration ?? expirationOptions[2];

  const scopeGroups = [
    {
      label: t("apiKeys.scopeGroupTickets"),
      scopes: [
        { value: "tickets:read", label: t("apiKeys.scopeTicketsRead") },
        { value: "tickets:write", label: t("apiKeys.scopeTicketsWrite") },
      ],
    },
    {
      label: t("apiKeys.scopeGroupComments"),
      scopes: [
        { value: "comments:read", label: t("apiKeys.scopeCommentsRead") },
        { value: "comments:write", label: t("apiKeys.scopeCommentsWrite") },
      ],
    },
    {
      label: t("apiKeys.scopeGroupMembers"),
      scopes: [
        { value: "members:read", label: t("apiKeys.scopeMembersRead") },
      ],
    },
    {
      label: t("apiKeys.scopeGroupAuth"),
      scopes: [
        { value: "auth:exchange", label: t("apiKeys.scopeAuthExchange") },
      ],
    },
  ];

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || scopes.length === 0) return;
    setSaving(true);
    try {
      const sel = selectedExpiration;
      const expiresAt = sel.days
        ? new Date(Date.now() + sel.days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      const result = await createApiKey(slug, {
        name: name.trim(),
        scopes,
        expiresAt,
      });
      setCreatedKey(result.key);
      onCreated();
    } catch {
      toast.error(t("apiKeys.createError"));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-body-bold text-heading mb-1">{t("apiKeys.createTitle")}</h2>
      <p className="text-sm text-muted mb-6">{t("apiKeys.createDescription")}</p>

      {createdKey ? (
        <div>
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
            <p className="text-xs font-body-semibold text-amber-800 dark:text-amber-300 mb-2">{t("apiKeys.copyWarning")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white dark:bg-gray-900 p-2 rounded border border-border-card break-all select-all">{createdKey}</code>
              <Button size="xs" color="light" onClick={handleCopy}>
                {copied ? t("apiKeys.copied") : t("apiKeys.copy")}
              </Button>
            </div>
          </div>
          <Button size="sm" color="primary" full onClick={onClose}>{t("common.done")}</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormInput label={t("apiKeys.name")} required>
            <Input
              placeholder={t("apiKeys.namePlaceholder")}
              value={name}
              onChange={setName}
            />
          </FormInput>

          <div className="mt-5">
            <p className="text-xs font-body-semibold text-heading mb-2">{t("apiKeys.scopesLabel")}</p>
            <div className="space-y-3">
              {scopeGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-exs text-muted mb-1">{group.label}</p>
                  <div className="space-y-1">
                    {group.scopes.map((scope) => (
                      <label key={scope.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className="rounded border-gray-300 text-primary focus:ring-primary/50"
                        />
                        <span className="text-xs text-body">{scope.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <FormInput label={t("apiKeys.expirationLabel")}>
              <Select
                options={expirationOptions}
                label={(o) => o.label}
                value={(o) => o.label === selectedExpiration.label}
                onChange={(o) => setExpiration(o)}
              />
            </FormInput>
          </div>

          <div className="mt-5">
            <Button size="sm" type="submit" full loading={saving} disabled={!name.trim() || scopes.length === 0}>
              {t("apiKeys.generate")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
