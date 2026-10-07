import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { WorkspaceRetention, getWorkspaceRetention, updateWorkspaceRetention } from "../services/audit-log.service";
import RetentionRow, { RetentionDraftRow, retentionRowValid } from "./RetentionRow";

interface Props {
  slug: string;
}

type Draft = Record<string, RetentionDraftRow>;

/** Each category shows what applies now; one at the installation's days just follows the installation. */
function toDraft(d: WorkspaceRetention): Draft {
  return Object.fromEntries(d.categories.map((c) => {
    const days = d.effective[c];
    return [c, { value: days === null ? "" : String(days), forever: days === null }];
  }));
}

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
    setDraft(toDraft(d));
  };

  useEffect(() => {
    getWorkspaceRetention(slug).then(load).catch(() => toast.error(t("auditRetention.loadError")));
  }, [slug]);

  if (!data) return null;

  // Categories the installation already keeps forever have nothing to extend
  const categories = data.categories.filter((c) => data.installation.days[c] !== null);
  const floorOf = (c: string) => data.installation.days[c] as number;
  const initial = toDraft(data);
  const changed = categories.some((c) => draft[c]?.forever !== initial[c]?.forever || (!draft[c]?.forever && draft[c]?.value !== initial[c]?.value));
  const valid = categories.every((c) => retentionRowValid(draft[c], floorOf(c), data.maxDays));

  const save = async () => {
    const days: Record<string, number | null> = {};
    for (const category of categories) {
      const row = draft[category];
      // A value equal to the installation's is dropped by the server: the category follows the installation
      days[category] = row.forever ? null : Number(row.value);
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
                  onChange={(value) => setDraft({ ...draft, [category]: { value, forever: false } })}
                  onForeverChange={(forever) => setDraft({ ...draft, [category]: { value: row?.value || String(floor), forever } })}
                />
              );
            })}
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" loading={saving} disabled={!changed || !valid} onClick={save}>{t("auditRetention.save")}</Button>
          </div>
        </>
      )}
    </div>
  );
}
