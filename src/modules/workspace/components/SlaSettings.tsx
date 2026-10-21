import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import useUnsavedChanges from "@modules/app/hooks/useUnsavedChanges";
import useExtensions from "@modules/app/extensions/useExtensions";
import {
  SlaPolicy,
  SlaPriorityTargets,
  getSlaPolicy,
  updateSlaPolicy,
} from "../services/workspace.service";

interface Props {
  slug: string;
}

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

/** How long removing the policy can be undone. */
const UNDO_MS = 8000;

const EMPTY_TARGETS: SlaPriorityTargets = {
  critical: null,
  high: null,
  medium: null,
  low: null,
};

function targetsEqual(a: SlaPriorityTargets, b: SlaPriorityTargets): boolean {
  return PRIORITIES.every((p) => a[p] === b[p]);
}

export default function SlaSettings({ slug }: Props) {
  const { t, tEnum } = useTranslation();
  const { isPlanLimitError, PlanGate } = useExtensions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [policy, setPolicy] = useState<SlaPolicy | null>(null);
  const [firstResponse, setFirstResponse] = useState<SlaPriorityTargets>({ ...EMPTY_TARGETS });
  const [resolution, setResolution] = useState<SlaPriorityTargets>({ ...EMPTY_TARGETS });

  const savedFirstResponse = useRef<SlaPriorityTargets>({ ...EMPTY_TARGETS });
  const savedResolution = useRef<SlaPriorityTargets>({ ...EMPTY_TARGETS });

  /** Shows a policy as the saved one: on load, after removing it, and after undoing that. */
  const showSaved = (saved: SlaPolicy | null) => {
    const fr = { ...EMPTY_TARGETS, ...saved?.firstResponse };
    const rs = { ...EMPTY_TARGETS, ...saved?.resolution };
    setPolicy(saved);
    setFirstResponse(fr);
    setResolution(rs);
    savedFirstResponse.current = { ...fr };
    savedResolution.current = { ...rs };
    setRawInputs({});
  };

  useEffect(() => {
    getSlaPolicy(slug, { silent: true })
      .then((res) => {
        setLocked(false);
        if (res.slaPolicy) showSaved(res.slaPolicy);
        else setPolicy(null);
      })
      .catch((err) => {
        if (isPlanLimitError(err)) setLocked(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const hasChanges =
    !targetsEqual(firstResponse, savedFirstResponse.current) ||
    !targetsEqual(resolution, savedResolution.current);
  useUnsavedChanges(!loading && hasChanges);

  const handleSave = async () => {
    setSaving(true);
    try {
      const hasAnyValue = [...Object.values(firstResponse), ...Object.values(resolution)]
        .some((v) => v !== null);

      const newPolicy: SlaPolicy | null = hasAnyValue
        ? { firstResponse, resolution }
        : null;

      await updateSlaPolicy(slug, newPolicy);
      setPolicy(newPolicy);
      savedFirstResponse.current = { ...firstResponse };
      savedResolution.current = { ...resolution };
      setRawInputs({});
      toast.success(t("workspaceSettings.slaSaved"));
    } catch {
      toast.error(t("workspaceSettings.slaSaveError"));
    } finally {
      setSaving(false);
    }
  };

  // Removing takes effect at once; for a few seconds the notice offers to put the same policy back
  const handleRemove = async () => {
    const removed = policy;
    setSaving(true);
    try {
      await updateSlaPolicy(slug, null);
      showSaved(null);
      const undo = async () => {
        try {
          await updateSlaPolicy(slug, removed);
          showSaved(removed);
          toast.success(t("workspaceSettings.slaRestored"));
        } catch {
          toast.error(t("workspaceSettings.slaSaveError"));
        }
      };
      toast.success(({ closeToast }) => (
        <div className="flex items-center gap-3 w-full">
          <span className="flex-1">{t("workspaceSettings.slaRemoved")}</span>
          <button
            type="button"
            onClick={() => { closeToast(); undo(); }}
            className="shrink-0 text-sm font-body-semibold text-primary hover:underline cursor-pointer"
          >
            {t("undo.action")}
          </button>
        </div>
      ), { autoClose: UNDO_MS });
    } catch {
      toast.error(t("workspaceSettings.slaSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  const updateTarget = (
    setter: (fn: (prev: SlaPriorityTargets) => SlaPriorityTargets) => void,
    key: string,
    priority: string,
    value: string,
  ) => {
    setRawInputs((prev) => ({ ...prev, [`${key}.${priority}`]: value }));
    const cleaned = value.endsWith(".") ? value.slice(0, -1) : value;
    const num = cleaned === "" ? null : parseFloat(cleaned);
    setter((prev) => ({ ...prev, [priority]: num }));
  };

  const getRawOrValue = (key: string, priority: string, targets: SlaPriorityTargets): string => {
    const rawKey = `${key}.${priority}`;
    if (rawInputs[rawKey] !== undefined) return rawInputs[rawKey];
    return targets[priority as keyof SlaPriorityTargets]?.toString() ?? "";
  };

  if (loading) return null;

  const content = (
    <div>
      <p className="text-xs text-muted mb-4">
        {t("workspaceSettings.slaDescription")}
      </p>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-body-semibold text-heading pb-2 pr-3 w-24" />
              <th className="text-xs font-body-semibold text-heading pb-2 px-3">
                {t("workspaceSettings.slaFirstResponse")}
              </th>
              <th className="text-xs font-body-semibold text-heading pb-2 pl-3">
                {t("workspaceSettings.slaResolution")}
              </th>
            </tr>
          </thead>
          <tbody>
            {PRIORITIES.map((p) => (
              <tr key={p}>
                <td className="text-xs text-muted py-1.5 pr-3">{tEnum("priority", p)}</td>
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="--"
                      disabled={locked}
                      aria-label={`${t("workspaceSettings.slaFirstResponse")} — ${tEnum("priority", p)}`}
                      value={getRawOrValue("fr", p, firstResponse)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d*\.?\d*$/.test(v)) {
                          updateTarget(setFirstResponse, "fr", p, v);
                        }
                      }}
                      className="h-max bg-surface rounded-input border-input transition-all duration-200 outline-none shadow-input text-body border-input-effect px-3 py-1 text-sm w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-exs text-muted shrink-0">{t("workspaceSettings.slaHours")}</span>
                  </div>
                </td>
                <td className="py-1.5 pl-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="--"
                      disabled={locked}
                      aria-label={`${t("workspaceSettings.slaResolution")} — ${tEnum("priority", p)}`}
                      value={getRawOrValue("res", p, resolution)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d*\.?\d*$/.test(v)) {
                          updateTarget(setResolution, "res", p, v);
                        }
                      }}
                      className="h-max bg-surface rounded-input border-input transition-all duration-200 outline-none shadow-input text-body border-input-effect px-3 py-1 text-sm w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-exs text-muted shrink-0">{t("workspaceSettings.slaHours")}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!locked && (
        <div className="flex justify-end gap-2">
          {policy && (
            <Button size="xs" color="light" onClick={handleRemove} loading={saving}>
              {t("workspaceSettings.slaRemove")}
            </Button>
          )}
          <Button size="xs" color="primary" onClick={handleSave} loading={saving} disabled={!hasChanges}>
            {t("settings.save")}
          </Button>
        </div>
      )}
    </div>
  );

  if (locked) {
    return (
      <div className="relative overflow-hidden rounded-lg">
        <div className="pointer-events-none select-none blur-[2px] opacity-40" aria-hidden>
          {content}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <PlanGate message={t("planLimit.slaLocked")} />
        </div>
      </div>
    );
  }

  return content;
}
