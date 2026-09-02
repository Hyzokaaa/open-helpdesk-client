import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import InviteSheet from "../components/InviteSheet";
import AddMemberSheet from "../components/AddMemberSheet";
import ImportMembersSheet from "../components/ImportMembersSheet";
import {
  WorkspaceMember,
  listMembers,
  removeMember,
  changeMemberRole,
} from "../services/workspace.service";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";

const ROLES = ["admin", "supervisor", "agent", "user"] as const;

export default function WorkspaceMembersPage() {
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { can } = usePermissions(workspaceSlug);
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const fetchMembers = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listMembers(workspaceSlug)
      .then((all) => setMembers(all.filter((m) => m.role !== "user")))
      .catch(() => toast.error(t("members.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, [workspaceSlug]);

  const canManageMembers = can(P.WORKSPACE_MEMBERS_MANAGE);

  const handleRemove = async () => {
    if (!workspaceSlug || !removeMemberId) return;
    try {
      await removeMember(workspaceSlug, removeMemberId);
      setRemoveMemberId(null);
      fetchMembers();
      toast.success(t("members.removed"));
    } catch {
      toast.error(t("members.removeError"));
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: string) => {
    if (!workspaceSlug) return;
    try {
      await changeMemberRole(workspaceSlug, memberUserId, newRole);
      fetchMembers();
      toast.success(t("members.roleUpdated"));
    } catch (err: any) {
      if (!err?.handled) toast.error(t("members.roleError"));
    }
  };

  const canEditRole = (member: WorkspaceMember) => {
    if (!canManageMembers) return false;
    if (user?.isSystemAdmin) return true;
    return member.role !== "admin";
  };

  const availableRoles = () => {
    if (user?.isSystemAdmin) return ROLES;
    return ROLES.filter((r) => r !== "admin");
  };

  const roleColor = (r: string) => {
    if (r === "admin") return "primary" as const;
    if (r === "agent") return "blue" as const;
    return "gray" as const;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("sidebar.team")}</h2>
        <div className="flex gap-2">
          {canManageMembers && (
            <Button size="sm" color="light" onClick={() => setShowImport(true)}>
              {t("import.title")}
            </Button>
          )}
          {canManageMembers && user?.isSystemAdmin && (
            <Button size="sm" color="light" onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? t("members.cancel") : t("members.add")}
            </Button>
          )}
          {can(P.WORKSPACE_INVITATIONS_MANAGE) && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              {t("invitations.invite")}
            </Button>
          )}
        </div>
      </div>

      {showAdd && workspaceSlug && (
        <AddMemberSheet
          workspaceSlug={workspaceSlug}
          existingMemberIds={members.map((m) => m.userId)}
          onClose={() => setShowAdd(false)}
          onAdded={fetchMembers}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("members.empty")}</p>
      ) : (
        <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase w-[200px]">{t("admin.col.name")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase w-[100px]">{t("admin.col.role")}</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border-row">
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-sm font-body-semibold text-heading block truncate">{m.firstName} {m.lastName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted block truncate" title={m.email}>{m.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={tEnum("role", m.role)} color={roleColor(m.role)} size="xs" />
                  </td>
                  <td className="px-2 py-3">
                    {(canManageMembers || can(P.REPORT_VIEW)) && (
                      <ActionMenu items={[
                        ...(can(P.REPORT_VIEW) ? [{
                          label: t("members.viewStats"),
                          onClick: () => navigate(`/dashboard/workspaces/${workspaceSlug}/stats/${m.userId}`),
                        }] : []),
                        ...(canEditRole(m) ? availableRoles()
                          .filter((r) => r !== m.role)
                          .map((r) => ({
                            label: `${t("members.changeRole")}: ${tEnum("role", r)}`,
                            onClick: () => handleRoleChange(m.userId, r),
                          })) : []),
                        ...(canManageMembers ? [{
                          label: t("members.remove"),
                          onClick: () => setRemoveMemberId(m.userId),
                          danger: true,
                        }] : []),
                      ]} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {removeMemberId && (
        <ConfirmModal
          title={t("members.remove")}
          message={t("common.confirmDeleteMessage")}
          confirmLabel={t("members.remove")}
          danger
          onConfirm={handleRemove}
          onCancel={() => setRemoveMemberId(null)}
        />
      )}
      {showInvite && workspaceSlug && (
        <InviteSheet
          workspaceSlug={workspaceSlug}
          onClose={() => setShowInvite(false)}
          onSent={fetchMembers}
        />
      )}
      {showImport && workspaceSlug && (
        <ImportMembersSheet
          workspaceSlug={workspaceSlug}
          onClose={() => setShowImport(false)}
          onImported={fetchMembers}
        />
      )}
    </div>
  );
}
