import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import InviteSheet from "../components/InviteSheet";
import {
  InvitationItem,
  listInvitations,
  cancelInvitation,
  resendInvitation,
  getInvitationLink,
} from "../services/invitation.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import useConfig from "@modules/app/hooks/useConfig";
import { getEmailSender } from "../services/email-sender.service";

export default function WorkspaceInvitationsPage() {
  const { workspaceSlug } = useParams();
  const { t, tEnum } = useTranslation();
  const formatDate = useFormatDate();
  const { emailConfigured } = useConfig();
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [hasWorkspaceSender, setHasWorkspaceSender] = useState(false);

  useEffect(() => {
    if (workspaceSlug) {
      getEmailSender(workspaceSlug).then((s) => setHasWorkspaceSender(!!s)).catch(() => {});
    }
  }, [workspaceSlug]);

  const canSendEmail = emailConfigured || hasWorkspaceSender;

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

  const handleCancel = async () => {
    if (!workspaceSlug || !cancelId) return;
    try {
      await cancelInvitation(workspaceSlug, cancelId);
      setCancelId(null);
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
        <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
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
                        label: t("invitations.copyLink"),
                        onClick: async () => {
                          try {
                            const link = await getInvitationLink(workspaceSlug!, inv.id);
                            await navigator.clipboard.writeText(link);
                            toast.success(t("invitations.linkCopied"));
                          } catch {
                            toast.error(t("invitations.sendError"));
                          }
                        },
                      },
                      ...(canSendEmail ? [{
                        label: t("invitations.resend"),
                        onClick: async () => {
                          try {
                            const result = await resendInvitation(workspaceSlug!, inv.id);
                            toast.success(result.emailSent ? t("invitations.resent") : t("invitations.createdNotSent"));
                            fetchInvitations();
                          } catch {
                            toast.error(t("invitations.sendError"));
                          }
                        },
                      }] : []),
                      {
                        label: t("invitations.cancel"),
                        onClick: () => setCancelId(inv.id),
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

      {cancelId && (
        <ConfirmModal
          title={t("invitations.cancel")}
          message={t("ticketDetail.deleteMessage")}
          confirmLabel={t("invitations.cancel")}
          danger
          onConfirm={handleCancel}
          onCancel={() => setCancelId(null)}
        />
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
