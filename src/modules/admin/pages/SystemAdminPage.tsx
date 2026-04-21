import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import WorkspaceSettingsPage from "@modules/workspace/pages/WorkspaceSettingsPage";
import useUser from "@modules/user/hooks/useUser";
import {
  UserItem,
  listAllUsers,
  createUser,
  toggleSystemAdmin,
  toggleUserActive,
} from "../services/admin.service";
import {
  Workspace,
  listWorkspaces,
  createWorkspace,
  deleteWorkspace,
} from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function SystemAdminPage() {
  const { user } = useUser();
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);
  const [confirmDeleteWs, setConfirmDeleteWs] = useState<string | null>(null);
  const [editingWsSlug, setEditingWsSlug] = useState<string | null>(null);

  if (!user?.isSystemAdmin) return <Navigate to="/dashboard" replace />;

  const fetchData = () => {
    setLoading(true);
    Promise.all([listAllUsers(), listWorkspaces()])
      .then(([u, w]) => { setUsers(u); setWorkspaces(w); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await createUser({ email, password, firstName, lastName, isSystemAdmin: isAdmin });
      setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setIsAdmin(false);
      setShowCreateUser(false);
      fetchData();
      toast.success(t("admin.userCreated"));
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || "Failed to create user");
    } finally { setCreatingUser(false); }
  };

  const handleToggleAdmin = async (target: UserItem) => {
    if (target.id === user.id) return;
    try {
      await toggleSystemAdmin(target.id, !target.isSystemAdmin);
      fetchData();
    } catch { toast.error("Failed to update admin status"); }
  };

  const handleToggleActive = async (target: UserItem) => {
    if (target.id === user.id) return;
    try {
      await toggleUserActive(target.id, !target.isActive);
      fetchData();
    } catch { toast.error("Failed to update user status"); }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingWs(true);
    try {
      await createWorkspace({ name: wsName, description: wsDescription });
      setWsName(""); setWsDescription("");
      setShowCreateWs(false);
      fetchData();
      toast.success(t("workspaces.created"));
    } catch { toast.error("Failed to create workspace"); }
    finally { setCreatingWs(false); }
  };

  const handleDeleteWorkspace = async (slug: string) => {
    try {
      await deleteWorkspace(slug);
      setConfirmDeleteWs(null);
      fetchData();
      toast.success(t("workspaces.deleted"));
    } catch { toast.error(t("workspaces.deleteError")); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full">
      {confirmDeleteWs && (
        <ConfirmModal
          title={t("workspaceSettings.deleteTitle")}
          message={t("workspaceSettings.deleteMessage")}
          confirmLabel={t("workspaceSettings.deleteConfirm")}
          danger
          onConfirm={() => handleDeleteWorkspace(confirmDeleteWs)}
          onCancel={() => setConfirmDeleteWs(null)}
        />
      )}

      {editingWsSlug && (
        <Sheet onClose={() => { setEditingWsSlug(null); fetchData(); }}>
          <WorkspaceSettingsPage workspaceSlugProp={editingWsSlug} onClose={() => { setEditingWsSlug(null); fetchData(); }} />
        </Sheet>
      )}

      <h2 className="text-lg font-body-bold text-heading mb-6">{t("admin.title")}</h2>

      {/* Users */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-body-semibold text-heading">{t("admin.manageUsers")}</p>
        <Button size="sm" onClick={() => setShowCreateUser(!showCreateUser)}>
          {showCreateUser ? t("admin.cancel") : t("admin.newUser")}
        </Button>
      </div>

      {showCreateUser && (
        <Card className="p-5 mb-4">
          <form onSubmit={handleCreateUser}>
            <div className="flex gap-4">
              <FormInput label={t("admin.firstName")} required className="flex-1">
                <Input placeholder="John" value={firstName} onChange={setFirstName} />
              </FormInput>
              <FormInput label={t("admin.lastName")} required className="flex-1">
                <Input placeholder="Doe" value={lastName} onChange={setLastName} />
              </FormInput>
            </div>
            <div className="flex gap-4">
              <FormInput label={t("admin.email")} required className="flex-1">
                <Input type="email" placeholder="user@example.com" value={email} onChange={setEmail} />
              </FormInput>
              <FormInput label={t("admin.password")} required className="flex-1">
                <Input type="password" placeholder={t("admin.passwordPlaceholder")} value={password} onChange={setPassword} />
              </FormInput>
            </div>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-secondary-text font-body-medium">{t("admin.systemAdmin")}</span>
            </label>
            <Button type="submit" size="sm" loading={creatingUser}>{t("admin.createUser")}</Button>
          </form>
        </Card>
      )}

      <div className="bg-surface border border-border-card rounded-lg overflow-hidden mb-10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-card">
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.role")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.status")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase w-[220px]">{t("admin.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border-row">
                <td className="px-4 py-3"><span className="text-sm font-body-semibold text-heading">{u.firstName} {u.lastName}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-muted">{u.email}</span></td>
                <td className="px-4 py-3">
                  {u.isSystemAdmin
                    ? <StatusBadge label={t("admin.systemAdmin")} color="primary" size="xs" />
                    : <StatusBadge label={t("admin.user")} color="gray" size="xs" />}
                </td>
                <td className="px-4 py-3">
                  {u.isActive
                    ? <StatusBadge label={t("admin.active")} color="green" size="xs" />
                    : <StatusBadge label={t("admin.inactive")} color="gray" size="xs" />}
                </td>
                <td className="px-4 py-3">
                  {u.id !== user.id && (
                    <div className="flex gap-2">
                      <Button size="xs" color={u.isSystemAdmin ? "light" : "primary-light"} onClick={() => handleToggleAdmin(u)}>
                        {u.isSystemAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
                      </Button>
                      <Button size="xs" color={u.isActive ? "danger" : "primary-light"} onClick={() => handleToggleActive(u)}>
                        {u.isActive ? t("admin.deactivate") : t("admin.activate")}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workspaces */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-body-semibold text-heading">{t("admin.manageWorkspaces")}</p>
        <Button size="sm" onClick={() => setShowCreateWs(!showCreateWs)}>
          {showCreateWs ? t("workspaces.cancel") : t("workspaces.new")}
        </Button>
      </div>

      {showCreateWs && (
        <Card className="p-5 mb-4">
          <form onSubmit={handleCreateWorkspace}>
            <div className="flex gap-4">
              <FormInput label={t("workspaces.name")} required className="flex-1">
                <Input placeholder={t("workspaces.namePlaceholder")} value={wsName} onChange={setWsName} />
              </FormInput>
              <FormInput label={t("workspaces.description")} className="flex-1">
                <Input placeholder={t("workspaces.descriptionPlaceholder")} value={wsDescription} onChange={setWsDescription} />
              </FormInput>
            </div>
            <Button type="submit" size="sm" loading={creatingWs} disabled={!wsName.trim()}>{t("workspaces.create")}</Button>
          </form>
        </Card>
      )}

      <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-card">
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.slug")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.description")}</th>
              <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase w-[220px]">{t("admin.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((ws) => (
              <tr key={ws.id} className="border-b border-border-row">
                <td className="px-4 py-3"><span className="text-sm font-body-semibold text-heading">{ws.name}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-muted">{ws.slug}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-muted">{ws.description || "-"}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                  <Button size="xs" color="light" onClick={() => setEditingWsSlug(ws.slug)}>
                    {t("workspaces.edit")}
                  </Button>
                  <Button size="xs" color="danger" onClick={() => setConfirmDeleteWs(ws.slug)}>
                    {t("workspaces.delete")}
                  </Button>
                  </div>
                </td>
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">{t("workspaces.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
