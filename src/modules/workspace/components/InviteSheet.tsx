import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import { createInvitationBatch, InvitationItem, listInvitations } from "../services/invitation.service";
import { getEmailSender } from "../services/email-sender.service";
import { listMembers, WorkspaceMember } from "../services/workspace.service";
import useExtensions from "@modules/app/extensions/useExtensions";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";

const ROLES = ["admin", "supervisor", "agent", "reporter"] as const;

interface Props {
  workspaceSlug: string;
  onClose: () => void;
  onSent?: () => void;
}

export default function InviteSheet({ workspaceSlug, onClose, onSent }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { emailConfigured } = useConfig();
  const { getAgentLimit } = useExtensions();
  const [rows, setRows] = useState([{ email: "", role: "reporter" }]);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationItem[]>([]);
  const [agentSlots, setAgentSlots] = useState<number | null>(null);
  const [hasWorkspaceSender, setHasWorkspaceSender] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(true);

  const canSendEmail = emailConfigured || hasWorkspaceSender;

  useEffect(() => {
    const isAgent = (role: string) => role === "admin" || role === "agent";

    const load = async () => {
      const [m, inv] = await Promise.all([
        listMembers(workspaceSlug),
        listInvitations(workspaceSlug),
        getEmailSender(workspaceSlug).then((s) => setHasWorkspaceSender(!!s)).catch(() => {}).finally(() => setCheckingEmail(false)),
      ]);
      setMembers(m);
      setPendingInvitations(inv);

      try {
        const limit = await getAgentLimit();
        if (limit !== null) {
          const agentMembers = m.filter((member) => isAgent(member.role)).length;
          const pendingAgents = inv.filter((i) => isAgent(i.role)).length;
          setAgentSlots(limit - agentMembers - pendingAgents);
        }
      } catch {}
    };

    load();
  }, [workspaceSlug]);

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
      if (sent > 0) {
        toast.success(`${sent} ${t("invitations.sent")}`);
      }
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

        {!checkingEmail && !canSendEmail && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg">
            <p className="text-xs text-danger">
              {t("invitations.noEmailConfigured").split("<a>").map((part, i) => {
                if (i === 0) return part;
                const [linkText, rest] = part.split("</a>");
                return (
                  <span key={i}>
                    <button
                      type="button"
                      className="underline font-body-semibold hover:opacity-80 cursor-pointer"
                      onClick={() => { onClose(); navigate(`/dashboard/workspaces/${workspaceSlug}/settings`); }}
                    >{linkText}</button>
                    {rest}
                  </span>
                );
              })}
            </p>
          </div>
        )}

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
              {canSendEmail ? t("invitations.send") : t("invitations.createInvitation")}
            </Button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
