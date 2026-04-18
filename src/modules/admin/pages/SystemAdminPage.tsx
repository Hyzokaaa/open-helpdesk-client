import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useUser from "@modules/user/hooks/useUser";
import {
  UserItem,
  listAllUsers,
  createUser,
  toggleSystemAdmin,
} from "../services/admin.service";

export default function SystemAdminPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!user?.isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchUsers = () => {
    setLoading(true);
    listAllUsers()
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createUser({
        email,
        password,
        firstName,
        lastName,
        isSystemAdmin: isAdmin,
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
      setShowCreate(false);
      fetchUsers();
      toast.success("User created");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAdmin = async (targetUser: UserItem) => {
    if (targetUser.id === user.id) {
      toast.error("You cannot change your own admin status");
      return;
    }
    try {
      await toggleSystemAdmin(targetUser.id, !targetUser.isSystemAdmin);
      fetchUsers();
      toast.success(
        targetUser.isSystemAdmin
          ? `${targetUser.firstName} is no longer a System Admin`
          : `${targetUser.firstName} is now a System Admin`,
      );
    } catch {
      toast.error("Failed to update admin status");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-body-bold text-gray-800">
            System Administration
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage users</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "New User"}
        </Button>
      </div>

      {showCreate && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate}>
            <div className="flex gap-4">
              <FormInput label="First Name" required className="flex-1">
                <Input
                  placeholder="John"
                  value={firstName}
                  onChange={setFirstName}
                />
              </FormInput>
              <FormInput label="Last Name" required className="flex-1">
                <Input
                  placeholder="Doe"
                  value={lastName}
                  onChange={setLastName}
                />
              </FormInput>
            </div>
            <div className="flex gap-4">
              <FormInput label="Email" required className="flex-1">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={setEmail}
                />
              </FormInput>
              <FormInput label="Password" required className="flex-1">
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={setPassword}
                />
              </FormInput>
            </div>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-gray-600 font-body-medium">
                System Admin
              </span>
            </label>
            <Button type="submit" size="sm" loading={creating}>
              Create User
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <span className="text-sm font-body-semibold text-gray-800">
                      {u.firstName} {u.lastName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isSystemAdmin ? (
                      <StatusBadge
                        label="System Admin"
                        color="primary"
                        size="xs"
                      />
                    ) : (
                      <StatusBadge label="User" color="gray" size="xs" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user.id && (
                      <Button
                        size="xs"
                        color={u.isSystemAdmin ? "light" : "primary-light"}
                        onClick={() => handleToggleAdmin(u)}
                      >
                        {u.isSystemAdmin ? "Remove Admin" : "Make Admin"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
