import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
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
  const { getPlans, getSubscription } = useExtensions();
  const [workspaceName, setWorkspaceName] = useState("");
  const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "agent" }]);
  const [loading, setLoading] = useState(false);
  const [maxAgents, setMaxAgents] = useState<number | null>(null);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPlans(), getSubscription()]).then(([plans, sub]: [any[], any]) => {
      if (sub && plans.length > 0) {
        const plan = plans.find((p: any) => p.id === sub.planId);
        if (plan && plan.limits.maxAgentsPerWorkspace !== -1) {
          setMaxAgents(plan.limits.maxAgentsPerWorkspace);
        }
      }
    }).catch(() => {});
  }, []);

  const agentInvites = invites.filter((i) => i.role === "agent" || i.role === "admin");
  const remainingSlots = maxAgents !== null
    ? Math.max(0, maxAgents - 1 - agentInvites.filter((i) => i.email.trim()).length)
    : null;

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

      if (ws.supportEmail) {
        setSupportEmail(ws.supportEmail);
      } else {
        toast.success(t("onboarding.workspaceCreated"));
        onDone();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t("onboarding.workspaceError"));
    } finally {
      setLoading(false);
    }
  };

  if (supportEmail) {
    return (
      <div className="bg-surface rounded-card border-card p-8 text-center">
        <div className="text-3xl mb-3">✉️</div>
        <h2 className="text-lg font-body-bold text-heading mb-2">{t("onboarding.workspaceReady")}</h2>
        <p className="text-sm text-muted mb-4">{t("onboarding.supportEmailDesc")}</p>
        <div className="bg-page rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-muted mb-1">{t("workspaceSettings.supportEmail")}</p>
          <p className="text-sm font-body-bold text-heading break-all">{supportEmail}</p>
        </div>
        <p className="text-xs text-muted mb-6">{t("onboarding.supportEmailHint")}</p>
        <Button full onClick={onDone}>{t("onboarding.goToDashboard")}</Button>
      </div>
    );
  }

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
            {remainingSlots !== null && (
              <span className="text-xs text-muted">
                {remainingSlots} {t("onboarding.slotsRemaining")}
              </span>
            )}
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

          {(remainingSlots === null || remainingSlots > 0) && (
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
