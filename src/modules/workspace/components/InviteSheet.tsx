import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import useConfig from "@modules/app/hooks/useConfig";
import { createInvitationBatch, InvitationItem, listInvitations } from "../services/invitation.service";
import { listMembers, WorkspaceMember } from "../services/workspace.service";
import { getPlans, getSubscription } from "@modules/billing/services/billing.service";
import useTranslation from "@modules/app/i18n/useTranslation";

const ROLES = ["admin", "agent", "reporter"] as const;

interface Props {
  workspaceSlug: string;
  onClose: () => void;
  onSent?: () => void;
}

export default function InviteSheet({ workspaceSlug, onClose, onSent }: Props) {
  const { t } = useTranslation();
  const { saasMode } = useConfig();
  const [rows, setRows] = useState([{ email: "", role: "reporter" }]);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationItem[]>([]);
  const [agentSlots, setAgentSlots] = useState<number | null>(null);

  useEffect(() => {
    const isAgent = (role: string) => role === "admin" || role === "agent";

    const load = async () => {
      const [m, inv] = await Promise.all([
        listMembers(workspaceSlug),
        listInvitations(workspaceSlug),
      ]);
      setMembers(m);
      setPendingInvitations(inv);

      if (saasMode) {
        try {
          const [plans, subscription] = await Promise.all([getPlans(), getSubscription()]);
          if (subscription) {
            const plan = plans.find((p) => p.id === subscription.planId);
            if (plan && plan.limits.maxAgentsPerWorkspace !== -1) {
              const agentMembers = m.filter((member) => isAgent(member.role)).length;
              const pendingAgents = inv.filter((i) => isAgent(i.role)).length;
              setAgentSlots(plan.limits.maxAgentsPerWorkspace - agentMembers - pendingAgents);
            }
          }
        } catch {}
      }
    };

    load();
  }, [workspaceSlug, saasMode]);

  const memberEmails = useMemo(
    () => new Set(members.map((m) => m.email.toLowerCase())),
    [members],
  );

  const pendingEmails = useMemo(
    () => new Set(pendingInvitations.map((i) => i.email.toLowerCase())),
    [pendingInvitations],
  );

  const updateRow = (index: number, field: "email" | "role", value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { email: "", role: "reporter" }]);
  };

  const validRows = rows.filter((r) => r.email.trim());

  const getRowError = (email: string, index: number): string | null => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    if (memberEmails.has(normalized)) return t("invitations.alreadyMember");
    if (pendingEmails.has(normalized)) return t("invitations.alreadyInvited");
    const seen = validRows.slice(0, index).map((r) => r.email.trim().toLowerCase());
    if (seen.includes(normalized)) return t("invitations.duplicateEmail");
    return null;
  };

  const newAgentCount = validRows.filter((r) => r.role === "admin" || r.role === "agent").length;
  const exceedsLimit = agentSlots !== null && newAgentCount > agentSlots;
  const hasErrors = rows.some((r, i) => getRowError(r.email, i) !== null);
  const canSubmit = validRows.length > 0 && !hasErrors && !exceedsLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    try {
      const results = await createInvitationBatch(
        workspaceSlug,
        validRows.map((r) => ({ email: r.email.trim(), role: r.role })),
      );
      const sent = results.filter((r) => r.status === "sent").length;
      const errors = results.filter((r) => r.status === "error");
      if (sent > 0) toast.success(`${sent} ${t("invitations.sent")}`);
      for (const err of errors) {
        toast.error(`${err.email}: ${err.error}`);
      }
      if (sent > 0) {
        onSent?.();
        onClose();
      }
    } catch (err: any) {
      if (!err?.handled) toast.error(t("invitations.sendError"));
    }
    setSending(false);
  };

  return (
    <Sheet onClose={onClose}>
      <div className="w-full">
        <h2 className="text-lg font-body-bold text-heading mb-3">{t("invitations.invite")}</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            {rows.map((row, i) => {
              const error = getRowError(row.email, i);
              return (
                <div key={i}>
                  <div className="flex gap-3 items-end">
                    <FormInput label={i === 0 ? t("invitations.email") : undefined} required className="flex-[3] !mb-0">
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={row.email}
                        onChange={(v) => updateRow(i, "email", v)}
                      />
                    </FormInput>
                    <FormInput label={i === 0 ? t("members.role") : undefined} required className="flex-1 !mb-0">
                      <Select
                        options={[...ROLES]}
                        label={(r) => r}
                        value={(r) => r === row.role}
                        onChange={(r) => updateRow(i, "role", r)}
                      />
                    </FormInput>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="w-8 h-8 flex items-center justify-center text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {error && (
                    <p className="text-exs text-danger mt-1">{error}</p>
                  )}
                </div>
              );
            })}
          </div>

          {exceedsLimit && (
            <p className="text-exs text-danger mt-3">
              {t("invitations.agentLimitExceeded").replace("{slots}", String(Math.max(0, agentSlots ?? 0)))}
            </p>
          )}

          <button
            type="button"
            onClick={addRow}
            className="w-full mt-3 py-2 border-2 border-dashed border-border-input rounded-lg text-xs font-body-medium text-muted hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
          >
            + {t("invitations.addAnother")}
          </button>

          <div className="flex justify-end gap-2 mt-6">
            <Button size="sm" color="light" onClick={onClose}>
              {t("members.cancel")}
            </Button>
            <Button type="submit" size="sm" loading={sending} disabled={!canSubmit}>
              {t("invitations.send")}
            </Button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
