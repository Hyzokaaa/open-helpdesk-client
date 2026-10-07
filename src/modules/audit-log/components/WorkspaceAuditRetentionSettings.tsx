import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { WorkspaceRetention, getWorkspaceRetention, updateWorkspaceRetention } from "../services/audit-log.service";
import RetentionRow from "./RetentionRow";

interface Props {
  slug: string;
}

type Draft = Record<string, { value: string; forever: boolean }>;

/**
 * How much longer than the installation this workspace keeps its audit history. It can only keep
 * more: the installation's days are the minimum, so nobody can erase the record of what they did.
 */
export default function WorkspaceAuditRetentionSettings({ slug }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<WorkspaceRetention | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);

  const load = (d: WorkspaceRetention) => {
    setData(d);
    setDraft(Object.fromEntries(Object.entries(d.overrides).map(([c, v]) => [c, { value: v === null ? "" : String(v), forever: v === null }])));
  };

  useEffect(() => {
    getWorkspaceRetention(slug).then(load).catch(() => toast.error(t("auditRetention.loadError")));
  }, [slug]);

  if (!data) return null;

  const save = async () => {
    const days: Record<string, number | null> = {};
    for (const [category, row] of Object.entries(draft)) {
      if (row.forever) days[category] = null;
      else if (row.value.trim() !== "") days[category] = Number(row.value);
    }
    setSaving(true);
    try {
      load(await updateWorkspaceRetention(slug, days));
      toast.success(t("auditRetention.saved"));
    } catch (err) {
      const e = err as HttpResponseError;
      if (!e?.handled) toast.error(e?.message || t("auditRetention.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-muted mb-2">{t("auditRetention.workspaceIntro")}</p>
      {!data.installation.enabled && (
        <p className="text-xs text-muted mb-2">{t("auditRetention.installationOff")}</p>
      )}
      <div className="divide-y divide-border-row">
        {data.categories.map((category) => {
          const floor = data.installation.days[category];
          if (floor === null) return null; // already kept forever by the installation
          return (
            <RetentionRow
              key={category}
              category={category}
              value={draft[category]?.value ?? ""}
              forever={draft[category]?.forever ?? false}
              placeholder={String(floor)}
              hint={t("auditRetention.minimum").replace("{days}", String(floor))}
              onChange={(value) => setDraft({ ...draft, [category]: { value, forever: false } })}
              onForeverChange={(forever) => setDraft({ ...draft, [category]: { value: draft[category]?.value ?? "", forever } })}
            />
          );
        })}
      </div>
      <div className="flex justify-end mt-3">
        <Button size="sm" loading={saving} onClick={save}>{t("auditRetention.save")}</Button>
      </div>
    </div>
  );
}
