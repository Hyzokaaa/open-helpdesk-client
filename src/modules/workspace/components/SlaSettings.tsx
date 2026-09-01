import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
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

  useEffect(() => {
    getSlaPolicy(slug, { silent: true })
      .then((res) => {
        setPolicy(res.slaPolicy);
        setLocked(false);
        if (res.slaPolicy) {
          const fr = { ...EMPTY_TARGETS, ...res.slaPolicy.firstResponse };
          const rs = { ...EMPTY_TARGETS, ...res.slaPolicy.resolution };
          setFirstResponse(fr);
          setResolution(rs);
          savedFirstResponse.current = { ...fr };
          savedResolution.current = { ...rs };
        }
      })
      .catch((err) => {
        if (isPlanLimitError(err)) setLocked(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const hasChanges =
    !targetsEqual(firstResponse, savedFirstResponse.current) ||
    !targetsEqual(resolution, savedResolution.current);

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

  const handleRemove = async () => {
    setSaving(true);
    try {
      await updateSlaPolicy(slug, null);
      setPolicy(null);
      setFirstResponse({ ...EMPTY_TARGETS });
      setResolution({ ...EMPTY_TARGETS });
      savedFirstResponse.current = { ...EMPTY_TARGETS };
      savedResolution.current = { ...EMPTY_TARGETS };
      toast.success(t("workspaceSettings.slaSaved"));
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
