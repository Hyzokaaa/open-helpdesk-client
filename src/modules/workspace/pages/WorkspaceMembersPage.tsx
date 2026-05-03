import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import InviteSheet from "../components/InviteSheet";
import AddMemberSheet from "../components/AddMemberSheet";
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

const ROLES = ["admin", "agent", "reporter"] as const;

export default function WorkspaceMembersPage() {
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { can } = usePermissions(workspaceSlug);
  const { t, tEnum } = useTranslation();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const fetchMembers = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listMembers(workspaceSlug)
      .then(setMembers)
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [workspaceSlug]);

  const canManageMembers = can(P.WORKSPACE_MEMBERS_MANAGE);

  const handleRemove = async (memberUserId: string) => {
    if (!workspaceSlug) return;
    try {
      await removeMember(workspaceSlug, memberUserId);
      fetchMembers();
      toast.success(t("members.removed"));
    } catch {
      toast.error("Failed to remove member");
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
        <h2 className="text-lg font-body-bold text-heading">{t("members.title")}</h2>
        <div className="flex gap-2">
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
        <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.role")}</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border-row">
                  <td className="px-4 py-3">
                    <span className="text-sm font-body-semibold text-heading">{m.firstName} {m.lastName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted">{m.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={tEnum("role", m.role)} color={roleColor(m.role)} size="xs" />
                  </td>
                  <td className="px-2 py-3">
                    {canManageMembers && (
                      <ActionMenu items={[
                        ...(canEditRole(m) ? availableRoles()
                          .filter((r) => r !== m.role)
                          .map((r) => ({
                            label: `${t("members.changeRole")}: ${tEnum("role", r)}`,
                            onClick: () => handleRoleChange(m.userId, r),
                          })) : []),
                        {
                          label: t("members.remove"),
                          onClick: () => handleRemove(m.userId),
                          danger: true,
                        },
                      ]} />
                    )}
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
          onSent={fetchMembers}
        />
      )}
    </div>
  );
}
