import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import {
  WorkspaceMember,
  UserListItem,
  listMembers,
  listUsers,
  addMember,
  removeMember,
  changeMemberRole,
} from "../services/workspace.service";
import {
  InvitationItem,
  createInvitation,
  listInvitations,
  cancelInvitation,
} from "../services/invitation.service";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";

const ROLES = ["admin", "agent", "reporter"] as const;

export default function WorkspaceMembersPage() {
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("reporter");
  const [adding, setAdding] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("reporter");
  const [inviting, setInviting] = useState(false);

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

  const fetchInvitations = () => {
    if (!workspaceSlug) return;
    listInvitations(workspaceSlug).then(setInvitations);
  };

  useEffect(() => {
    fetchMembers();
    fetchUsers();
    fetchInvitations();
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await createInvitation(workspaceSlug, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      setShowInvite(false);
      fetchInvitations();
      toast.success(t("invitations.sent"));
    } catch {
      toast.error(t("invitations.sendError"));
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    if (!workspaceSlug) return;
    try {
      await cancelInvitation(workspaceSlug, id);
      fetchInvitations();
      toast.success(t("invitations.cancelled"));
    } catch {
      toast.error(t("invitations.cancelError"));
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

  const availableRoles = (_member: WorkspaceMember) => {
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">{t("members.title")}</h2>
        {canManageMembers && (
          <div className="flex gap-2">
            <Button size="sm" color="light" onClick={() => { setShowAdd(!showAdd); setShowInvite(false); }}>
              {showAdd ? t("members.cancel") : t("members.add")}
            </Button>
            <Button size="sm" onClick={() => { setShowInvite(!showInvite); setShowAdd(false); }}>
              {showInvite ? t("members.cancel") : t("invitations.invite")}
            </Button>
          </div>
        )}
      </div>

      {showAdd && (
        <Card className="p-5 mb-6">
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

      {showInvite && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleInvite}>
            <div className="flex gap-4">
              <FormInput label={t("invitations.email")} required className="flex-[3]">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={setInviteEmail}
                />
              </FormInput>
              <FormInput label={t("members.role")} required className="flex-1">
                <Select
                  options={[...ROLES]}
                  label={(r) => r}
                  value={(r) => r === inviteRole}
                  onChange={(r) => setInviteRole(r)}
                />
              </FormInput>
            </div>
            <Button type="submit" size="sm" loading={inviting} disabled={!inviteEmail.trim()}>
              {t("invitations.send")}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("members.empty")}</p>
      ) : (
        <div className="grid gap-2">
          {members.map((m) => (
            <Card key={m.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <p className="text-sm font-body-semibold text-body">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs text-subtle">{m.email}</p>
                {canEditRole(m) ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                    className="text-xs border border-border-input rounded-md px-2 py-1 bg-surface text-body cursor-pointer"
                  >
                    {availableRoles(m).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge label={m.role} color={roleColor(m.role)} size="xs" />
                )}
              </div>
              {canManageMembers && (
                <ActionMenu items={[
                  {
                    label: t("members.remove"),
                    onClick: () => handleRemove(m.userId),
                    danger: true,
                  },
                ]} />
              )}
            </Card>
          ))}
        </div>
      )}

      {canManageMembers && invitations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-body-bold text-heading mb-3">{t("invitations.pending")}</h3>
          <div className="grid gap-2">
            {invitations.map((inv) => (
              <Card key={inv.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-x-3">
                  <p className="text-sm font-body-medium text-body">{inv.email}</p>
                  <StatusBadge label={inv.role} color={roleColor(inv.role)} size="xs" />
                  <span className="text-exs text-subtle">
                    {t("invitations.expires")} {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <ActionMenu items={[
                  {
                    label: t("invitations.cancel"),
                    onClick: () => handleCancelInvitation(inv.id),
                    danger: true,
                  },
                ]} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
