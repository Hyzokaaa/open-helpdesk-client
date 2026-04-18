import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import {
  WorkspaceMember,
  UserListItem,
  listMembers,
  listUsers,
  addMember,
  removeMember,
} from "../services/workspace.service";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";

const ROLES = ["admin", "agent", "reporter"] as const;

export default function WorkspaceMembersPage() {
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { can } = usePermissions(workspaceSlug);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("reporter");
  const [adding, setAdding] = useState(false);

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
      toast.success("Member added");
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
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const roleColor = (r: string) => {
    if (r === "admin") return "primary" as const;
    if (r === "agent") return "blue" as const;
    return "gray" as const;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-gray-800">Members</h2>
        {canManageMembers && (
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "Add Member"}
          </Button>
        )}
      </div>

      {showAdd && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleAdd}>
            <div className="flex gap-4">
              <FormInput label="User" required className="flex-[3]">
                <Select
                  options={availableUsers}
                  label={(u) => `${u.firstName} ${u.lastName} (${u.email})`}
                  value={(u) => u.id === selectedUserId}
                  onChange={(u) => setSelectedUserId(u.id)}
                  placeholder="Select a user..."
                />
              </FormInput>
              <FormInput label="Role" required className="flex-1">
                <Select
                  options={[...ROLES]}
                  label={(r) => r}
                  value={(r) => r === role}
                  onChange={(r) => setRole(r)}
                />
              </FormInput>
            </div>
            <Button type="submit" size="sm" loading={adding} disabled={!selectedUserId}>
              Add
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">No members.</p>
      ) : (
        <div className="grid gap-2">
          {members.map((m) => (
            <Card key={m.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <p className="text-sm font-body-semibold text-gray-700">
                  {m.firstName} {m.lastName}
                </p>
                <p className="text-xs text-gray-400">{m.email}</p>
                <StatusBadge label={m.role} color={roleColor(m.role)} size="xs" />
              </div>
              {canManageMembers && (
              <Button
                size="xs"
                color="danger"
                onClick={() => handleRemove(m.userId)}
              >
                Remove
              </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
