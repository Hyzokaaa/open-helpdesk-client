import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { WorkspaceRetention, getWorkspaceRetention, updateWorkspaceRetention } from "../services/audit-log.service";
import RetentionRow, { retentionRowValid } from "./RetentionRow";
import useRetentionDraft from "../hooks/useRetentionDraft";

interface Props {
  slug: string;
}

/**
 * How long this workspace keeps its audit history. Never less than the installation, so nobody can
 * erase the record of what they did. Each category shows what applies now; only the ones changed are
 * saved, and a saved one keeps its days even if the installation is lowered later.
 */
export default function WorkspaceAuditRetentionSettings({ slug }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<WorkspaceRetention | null>(null);
  const { draft, reset, isChanged, setValue, setForever, daysOf } = useRetentionDraft();
  const [saving, setSaving] = useState(false);

  const load = (d: WorkspaceRetention) => {
    setData(d);
    reset(d.effective);
  };

  useEffect(() => {
    getWorkspaceRetention(slug).then(load).catch(() => toast.error(t("auditRetention.loadError")));
  }, [slug]);

  if (!data) return null;

  // Categories the installation already keeps forever have nothing to extend
  const categories = data.categories.filter((c) => data.installation.days[c] !== null);
  const floorOf = (c: string) => data.installation.days[c] as number;
  const changed = categories.filter(isChanged);
  const valid = categories.every((c) => retentionRowValid(draft[c], floorOf(c), data.maxDays));

  const save = async () => {
    const days: Record<string, number | null> = {};
    for (const category of changed) days[category] = daysOf(category);
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
      <p className="text-xs text-muted mb-3">{t("auditRetention.workspaceIntro")}</p>
      {!data.installation.enabled && (
        <p className="rounded-md bg-surface-hover px-3 py-2 text-xs text-body mb-3">{t("auditRetention.installationOff")}</p>
      )}
      {categories.length === 0 ? (
        <p className="text-xs text-muted">{t("auditRetention.allForever")}</p>
      ) : (
        <>
          <div className="divide-y divide-border-card">
            {categories.map((category) => {
              const floor = floorOf(category);
              const row = draft[category];
              return (
                <RetentionRow
                  key={category}
                  category={category}
                  value={row?.value ?? ""}
                  forever={row?.forever ?? false}
                  min={floor}
                  max={data.maxDays}
                  fallback={floor}
                  hint={t("auditRetention.minimum").replace("{days}", String(floor))}
                  onChange={(value) => setValue(category, value)}
                  onForeverChange={(forever) => setForever(category, forever, floor)}
                />
              );
            })}
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" loading={saving} disabled={changed.length === 0 || !valid} onClick={save}>{t("auditRetention.save")}</Button>
          </div>
        </>
      )}
    </div>
  );
}
