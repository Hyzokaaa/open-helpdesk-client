import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import useColumnDrag from "@modules/shared/hooks/useColumnDrag";
import SortableTh from "@modules/app/modules/ui/components/SortableTh/SortableTh";
import Button from "@modules/app/modules/ui/components/Button/Button";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import useUser from "@modules/user/hooks/useUser";
import {
  UserItem,
  listAllUsers,
  createUser,
  toggleSystemAdmin,
  toggleUserActive,
  updateUserProfile,
} from "../services/admin.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function AdminUsersPage() {
  const { user } = useUser();
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);

  const [confirmToggleAdmin, setConfirmToggleAdmin] = useState<UserItem | null>(null);
  const [confirmToggleActive, setConfirmToggleActive] = useState<UserItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const columnKeys = ["name", "email", "role", "status"];
  const sensors = useSensors(useSensor(PointerSensor));
  const { order, handleDragEnd, reorder } = useColumnDrag(columnKeys);

  const columns = [
    { key: "name", label: t("admin.col.name"), sortable: true, sortField: "firstName" },
    { key: "email", label: t("admin.col.email"), sortable: true, sortField: "email" },
    { key: "role", label: t("admin.col.role"), sortable: true, sortField: "isSystemAdmin" },
    { key: "status", label: t("admin.col.status"), sortable: true, sortField: "isActive" },
  ];

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const u = await listAllUsers({ sortBy, sortOrder });
      setUsers(u);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [sortBy, sortOrder]);

  if (!user?.isSystemAdmin) return <Navigate to="/dashboard" replace />;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await createUser({ email, password, firstName, lastName, isSystemAdmin: isAdmin, isEmailVerified });
      setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setIsAdmin(false); setIsEmailVerified(true);
      setShowCreateUser(false);
      fetchData();
      toast.success(t("admin.userCreated"));
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || "Failed to create user");
    } finally { setCreatingUser(false); }
  };

  const handleToggleAdmin = async (target: UserItem) => {
    try {
      await toggleSystemAdmin(target.id, !target.isSystemAdmin);
      setConfirmToggleAdmin(null);
      fetchData();
    } catch { toast.error("Failed to update admin status"); }
  };

  const handleEditUser = (u: UserItem) => {
    setEditingUser(u);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditEmail(u.email);
  };

  const handleSaveUserProfile = async () => {
    if (!editingUser) return;
    try {
      await updateUserProfile(editingUser.id, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
      });
      setEditingUser(null);
      fetchData();
      toast.success(t("admin.profileUpdated"));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update profile";
      toast.error(msg);
    }
  };

  const handleToggleActive = async (target: UserItem) => {
    try {
      await toggleUserActive(target.id, !target.isActive);
      setConfirmToggleActive(null);
      fetchData();
    } catch { toast.error("Failed to update user status"); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full">
      {confirmToggleAdmin && (
        <ConfirmModal
          title={confirmToggleAdmin.isSystemAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
          message={t(confirmToggleAdmin.isSystemAdmin ? "admin.confirmRemoveAdmin" : "admin.confirmMakeAdmin").replace("{name}", `${confirmToggleAdmin.firstName} ${confirmToggleAdmin.lastName}`)}
          confirmLabel={confirmToggleAdmin.isSystemAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
          danger={confirmToggleAdmin.isSystemAdmin}
          onConfirm={() => handleToggleAdmin(confirmToggleAdmin)}
          onCancel={() => setConfirmToggleAdmin(null)}
        />
      )}

      {confirmToggleActive && (
        <ConfirmModal
          title={confirmToggleActive.isActive ? t("admin.deactivate") : t("admin.activate")}
          message={t(confirmToggleActive.isActive ? "admin.confirmDeactivate" : "admin.confirmActivate").replace("{name}", `${confirmToggleActive.firstName} ${confirmToggleActive.lastName}`)}
          confirmLabel={confirmToggleActive.isActive ? t("admin.deactivate") : t("admin.activate")}
          danger={confirmToggleActive.isActive}
          onConfirm={() => handleToggleActive(confirmToggleActive)}
          onCancel={() => setConfirmToggleActive(null)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("admin.manageUsers")}</h2>
        <Button size="sm" onClick={() => setShowCreateUser(!showCreateUser)}>
          {showCreateUser ? t("admin.cancel") : t("admin.newUser")}
        </Button>
      </div>

      {showCreateUser && (
        <Sheet onClose={() => setShowCreateUser(false)}>
          <h3 className="text-lg font-body-bold text-heading mb-4">{t("admin.newUser")}</h3>
          <form onSubmit={handleCreateUser}>
            <div className="flex gap-4">
              <FormInput label={t("admin.firstName")} required className="flex-1">
                <Input placeholder="John" value={firstName} onChange={setFirstName} required />
              </FormInput>
              <FormInput label={t("admin.lastName")} required className="flex-1">
                <Input placeholder="Doe" value={lastName} onChange={setLastName} required />
              </FormInput>
            </div>
            <div className="flex gap-4">
              <FormInput label={t("admin.email")} required className="flex-1">
                <Input type="email" placeholder="user@example.com" value={email} onChange={setEmail} required />
              </FormInput>
              <FormInput label={t("admin.password")} required className="flex-1">
                <Input type="password" placeholder={t("admin.passwordPlaceholder")} value={password} onChange={setPassword} required />
              </FormInput>
            </div>
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-secondary-text font-body-medium">{t("admin.systemAdmin")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isEmailVerified} onChange={(e) => setIsEmailVerified(e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-secondary-text font-body-medium">{t("admin.emailVerified")}</span>
              </label>
            </div>
            <Button type="submit" size="sm" loading={creatingUser}>{t("admin.createUser")}</Button>
          </form>
        </Sheet>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
        <table className="w-full table-fixed">
          <thead>
            <SortableContext items={order} strategy={horizontalListSortingStrategy}>
            <tr className="border-b border-border-card bg-surface-hover">
              {reorder(columns).map((col) => (
                <SortableTh
                  key={col.key}
                  id={col.key}
                  sortable={col.sortable}
                  onClick={() => col.sortable && col.sortField && toggleSort(col.sortField)}
                >
                  {col.label}
                  {col.sortField && sortBy === col.sortField && (
                    <span className="text-primary">
                      {sortOrder === "ASC" ? "↑" : "↓"}
                    </span>
                  )}
                </SortableTh>
              ))}
              <th className="px-2 py-3 bg-surface-hover sticky right-0 w-10" />
            </tr>
            </SortableContext>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border-row">
                {reorder(columns).map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.key === "name" && (
                      <span className="text-sm font-body-semibold text-heading block truncate">{u.firstName} {u.lastName}</span>
                    )}
                    {col.key === "email" && (
                      <span className="text-sm text-muted block truncate" title={u.email}>{u.email}</span>
                    )}
                    {col.key === "role" && (
                      u.isSystemAdmin
                        ? <StatusBadge label={t("admin.systemAdmin")} color="primary" size="xs" />
                        : <StatusBadge label={t("admin.user")} color="gray" size="xs" />
                    )}
                    {col.key === "status" && (
                      u.isActive
                        ? <StatusBadge label={t("admin.active")} color="green" size="xs" />
                        : <StatusBadge label={t("admin.inactive")} color="gray" size="xs" />
                    )}
                  </td>
                ))}
                <td className="px-2 py-3 sticky right-0 bg-surface">
                  {u.id !== user.id && (
                    <ActionMenu items={[
                      {
                        label: t("admin.editProfile"),
                        onClick: () => handleEditUser(u),
                      },
                      {
                        label: u.isSystemAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin"),
                        onClick: () => setConfirmToggleAdmin(u),
                      },
                      {
                        label: u.isActive ? t("admin.deactivate") : t("admin.activate"),
                        onClick: () => setConfirmToggleActive(u),
                        danger: u.isActive,
                      },
                    ]} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </DndContext>
      {editingUser && (
        <Sheet onClose={() => setEditingUser(null)}>
          <h3 className="text-lg font-body-bold text-heading mb-4">{t("admin.editProfile")}</h3>
          <div className="flex gap-3 mb-3">
            <FormInput label={t("admin.firstName")} className="flex-1">
              <Input value={editFirstName} onChange={setEditFirstName} />
            </FormInput>
            <FormInput label={t("admin.lastName")} className="flex-1">
              <Input value={editLastName} onChange={setEditLastName} />
            </FormInput>
          </div>
          <FormInput label={t("admin.email")} className="mb-4">
            <Input type="email" value={editEmail} onChange={setEditEmail} />
          </FormInput>
          <div className="flex gap-2 justify-end">
            <Button size="sm" color="light" onClick={() => setEditingUser(null)}>{t("admin.cancel")}</Button>
            <Button size="sm" onClick={handleSaveUserProfile}>{t("members.save")}</Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
