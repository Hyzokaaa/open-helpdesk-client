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
import useTranslation from "@modules/app/i18n/useTranslation";

export default function SystemAdminPage() {
  const { user } = useUser();
  const { t } = useTranslation();
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
      toast.success(t("admin.userCreated"));
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
          <h2 className="text-lg font-body-bold text-gray-800 dark:text-gray-100">
            {t("admin.title")}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("admin.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? t("admin.cancel") : t("admin.newUser")}
        </Button>
      </div>

      {showCreate && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate}>
            <div className="flex gap-4">
              <FormInput label={t("admin.firstName")} required className="flex-1">
                <Input
                  placeholder="John"
                  value={firstName}
                  onChange={setFirstName}
                />
              </FormInput>
              <FormInput label={t("admin.lastName")} required className="flex-1">
                <Input
                  placeholder="Doe"
                  value={lastName}
                  onChange={setLastName}
                />
              </FormInput>
            </div>
            <div className="flex gap-4">
              <FormInput label={t("admin.email")} required className="flex-1">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={setEmail}
                />
              </FormInput>
              <FormInput label={t("admin.password")} required className="flex-1">
                <Input
                  type="password"
                  placeholder={t("admin.passwordPlaceholder")}
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
              <span className="text-sm text-gray-600 dark:text-gray-300 font-body-medium">
                {t("admin.systemAdmin")}
              </span>
            </label>
            <Button type="submit" size="sm" loading={creating}>
              {t("admin.createUser")}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {t("admin.col.name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {t("admin.col.email")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {t("admin.col.role")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {t("admin.col.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700">
                  <td className="px-4 py-3">
                    <span className="text-sm font-body-semibold text-gray-800 dark:text-gray-100">
                      {u.firstName} {u.lastName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isSystemAdmin ? (
                      <StatusBadge
                        label={t("admin.systemAdmin")}
                        color="primary"
                        size="xs"
                      />
                    ) : (
                      <StatusBadge label={t("admin.user")} color="gray" size="xs" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user.id && (
                      <Button
                        size="xs"
                        color={u.isSystemAdmin ? "light" : "primary-light"}
                        onClick={() => handleToggleAdmin(u)}
                      >
                        {u.isSystemAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
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
