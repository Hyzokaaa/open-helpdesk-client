import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import InviteSheet from "../components/InviteSheet";
import {
  InvitationItem,
  listInvitations,
  cancelInvitation,
} from "../services/invitation.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function WorkspaceInvitationsPage() {
  const { workspaceSlug } = useParams();
  const { t, tEnum } = useTranslation();
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const fetchInvitations = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listInvitations(workspaceSlug)
      .then(setInvitations)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvitations();
  }, [workspaceSlug]);

  const handleCancel = async (id: string) => {
    if (!workspaceSlug) return;
    try {
      await cancelInvitation(workspaceSlug, id);
      fetchInvitations();
      toast.success(t("invitations.cancelled"));
    } catch {
      toast.error(t("invitations.cancelError"));
    }
  };

  const roleColor = (r: string) => {
    if (r === "admin") return "primary" as const;
    if (r === "agent") return "blue" as const;
    return "gray" as const;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("invitations.pageTitle")}</h2>
        <Button size="sm" onClick={() => setShowInvite(true)}>
          {t("invitations.invite")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : invitations.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("invitations.empty")}</p>
      ) : (
        <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.role")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("invitations.expires")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("invitations.sentAt")}</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-border-row">
                  <td className="px-4 py-3">
                    <span className="text-sm font-body-semibold text-heading">{inv.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={tEnum("role", inv.role)} color={roleColor(inv.role)} size="xs" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted">{formatDate(inv.expiresAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted">{formatDate(inv.createdAt)}</span>
                  </td>
                  <td className="px-2 py-3">
                    <ActionMenu items={[
                      {
                        label: t("invitations.cancel"),
                        onClick: () => handleCancel(inv.id),
                        danger: true,
                      },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && workspaceSlug && (
        <InviteSheet
          workspaceSlug={workspaceSlug}
          onClose={() => setShowInvite(false)}
          onSent={fetchInvitations}
        />
      )}
    </div>
  );
}
