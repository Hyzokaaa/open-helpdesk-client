import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getPlans, getSubscription, type Plan } from "@modules/billing/services/billing.service";
import { createWorkspace } from "@modules/workspace/services/workspace.service";
import { createInvitationBatch } from "@modules/workspace/services/invitation.service";

interface Invite {
  email: string;
  role: string;
}

interface Props {
  onDone: () => void;
  onSkip: () => void;
}

export default function StepWorkspace({ onDone, onSkip }: Props) {
  const { t } = useTranslation();
  const [workspaceName, setWorkspaceName] = useState("");
  const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "agent" }]);
  const [loading, setLoading] = useState(false);
  const [maxAgents, setMaxAgents] = useState(2);

  useEffect(() => {
    Promise.all([getPlans(), getSubscription()]).then(([plans, sub]) => {
      if (sub) {
        const plan = plans.find((p) => p.id === sub.planId);
        if (plan && plan.limits.maxAgentsPerWorkspace !== -1) {
          setMaxAgents(plan.limits.maxAgentsPerWorkspace);
        }
      }
    }).catch(() => {});
  }, []);

  const agentInvites = invites.filter((i) => i.role === "agent" || i.role === "admin");
  const remainingSlots = Math.max(0, maxAgents - 1 - agentInvites.filter((i) => i.email.trim()).length);

  const updateInvite = (index: number, field: keyof Invite, value: string) => {
    setInvites((prev) => prev.map((inv, i) => (i === index ? { ...inv, [field]: value } : inv)));
  };

  const addInvite = () => {
    setInvites((prev) => [...prev, { email: "", role: "agent" }]);
  };

  const removeInvite = (index: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setLoading(true);
    try {
      const ws = await createWorkspace({ name: workspaceName.trim(), description: "" });

      const validInvites = invites.filter((i) => i.email.trim());
      if (validInvites.length > 0) {
        await createInvitationBatch(ws.slug, validInvites);
      }

      toast.success(t("onboarding.workspaceCreated"));
      onDone();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t("onboarding.workspaceError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-card border-card p-8">
      <h2 className="text-lg font-body-bold text-heading mb-1">{t("onboarding.setupWorkspace")}</h2>
      <p className="text-sm text-muted mb-6">{t("onboarding.setupWorkspaceDesc")}</p>

      <form onSubmit={handleSubmit}>
        <FormInput label={t("onboarding.workspaceName")} required>
          <Input
            placeholder={t("onboarding.workspaceNamePlaceholder")}
            value={workspaceName}
            onChange={setWorkspaceName}
          />
        </FormInput>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-body-medium text-heading">{t("onboarding.inviteMembers")}</label>
            <span className="text-xs text-muted">
              {remainingSlots} {t("onboarding.slotsRemaining")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {invites.map((inv, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inv.email}
                    onChange={(v) => updateInvite(i, "email", v)}
                  />
                </div>
                <div className="w-28">
                  <Select
                    options={["agent", "admin"]}
                    label={(r) => r === "admin" ? "Admin" : "Agent"}
                    value={(r) => r === inv.role}
                    onChange={(r) => updateInvite(i, "role", r)}
                  />
                </div>
                {invites.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInvite(i)}
                    className="text-muted hover:text-danger text-sm mt-2 cursor-pointer"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>

          {remainingSlots > 0 && (
            <button
              type="button"
              onClick={addInvite}
              className="text-xs text-primary hover:underline mt-2 cursor-pointer"
            >
              + {t("onboarding.addAnother")}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" full loading={loading} disabled={!workspaceName.trim()}>
            {t("onboarding.createAndFinish")}
          </Button>
          <Button type="button" full color="light" onClick={onSkip}>
            {t("onboarding.skipForNow")}
          </Button>
        </div>
      </form>
    </div>
  );
}
