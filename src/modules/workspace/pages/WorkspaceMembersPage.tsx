import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import InviteSheet from "../components/InviteSheet";
import {
  WorkspaceMember,
  UserListItem,
  listMembers,
  listUsers,
  addMember,
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
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("reporter");
  const [adding, setAdding] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const fetchMembers = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listMembers(workspaceSlug)
      .then(setMembers)
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    listUsers().then(setUsers);
  };

  useEffect(() => {
    fetchMembers();
    fetchUsers();
  }, [workspaceSlug]);

  const canManageMembers = can(P.WORKSPACE_MEMBERS_MANAGE);

  const availableUsers = users.filter(
    (u) => !members.some((m) => m.userId === u.id),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !selectedUserId) return;
    setAdding(true);
    try {
      await addMember(workspaceSlug, { userId: selectedUserId, role });
      setSelectedUserId(null);
      setShowAdd(false);
      fetchMembers();
      toast.success(t("members.added"));
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAdding(false);
    }
  };

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
    } catch {
      toast.error(t("members.roleError"));
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

      {showAdd && (
        <Card className="p-5 mb-4">
          <form onSubmit={handleAdd}>
            <div className="flex gap-4">
              <FormInput label={t("members.user")} required className="flex-[3]">
                <Select
                  options={availableUsers}
                  label={(u) => `${u.firstName} ${u.lastName} (${u.email})`}
                  value={(u) => u.id === selectedUserId}
                  onChange={(u) => setSelectedUserId(u.id)}
                  placeholder={t("members.selectUser")}
                />
              </FormInput>
              <FormInput label={t("members.role")} required className="flex-1">
                <Select
                  options={[...ROLES]}
                  label={(r) => r}
                  value={(r) => r === role}
                  onChange={(r) => setRole(r)}
                />
              </FormInput>
            </div>
            <Button type="submit" size="sm" loading={adding} disabled={!selectedUserId}>
              {t("members.add")}
            </Button>
          </form>
        </Card>
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
