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
import { UserItem, listAllUsers, createUser } from "../services/admin.service";

export default function SystemAdminPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await createUser({ email, password, firstName, lastName });
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-50"
                >
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
                      <StatusBadge label="System Admin" color="primary" size="xs" />
                    ) : (
                      <StatusBadge label="User" color="gray" size="xs" />
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
