import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import useColumnDrag from "@modules/shared/hooks/useColumnDrag";
import SortableTh from "@modules/app/modules/ui/components/SortableTh/SortableTh";
import Button from "@modules/app/modules/ui/components/Button/Button";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useUser from "@modules/user/hooks/useUser";
import useConfig from "@modules/app/hooks/useConfig";
import {
  UserItem,
  listAllUsers,
  createUser,
  toggleSystemAdmin,
  toggleUserActive,
} from "../services/admin.service";
import {
  getPlans,
  adminUpdateSubscription,
  type Plan,
} from "@modules/billing/services/billing.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function AdminUsersPage() {
  const { user } = useUser();
  const { saasMode } = useConfig();
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
  const [changePlanUser, setChangePlanUser] = useState<UserItem | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlans, setUserPlans] = useState<Record<string, string>>({});

  const baseKeys = ["name", "email", "role", "status"];
  const columnKeys = saasMode ? [...baseKeys, "plan"] : baseKeys;
  const sensors = useSensors(useSensor(PointerSensor));
  const { order, handleDragEnd, reorder } = useColumnDrag(columnKeys);

  const columns = [
    { key: "name", label: t("admin.col.name"), sortable: true, sortField: "firstName" },
    { key: "email", label: t("admin.col.email"), sortable: true, sortField: "email" },
    { key: "role", label: t("admin.col.role"), sortable: true, sortField: "isSystemAdmin" },
    { key: "status", label: t("admin.col.status"), sortable: true, sortField: "isActive" },
    ...(saasMode ? [{ key: "plan", label: t("admin.col.plan"), sortable: true, sortField: "planId" }] : []),
  ];

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  if (!user?.isSystemAdmin) return <Navigate to="/dashboard" replace />;

  const fetchData = async () => {
    setLoading(true);
    try {
      const u = await listAllUsers({ sortBy, sortOrder });
      setUsers(u);
      if (saasMode) {
        const p = await getPlans();
        setPlans(p);
        const planMap: Record<string, string> = {};
        for (const user of u) {
          if (user.planId) planMap[user.id] = user.planId;
        }
        setUserPlans(planMap);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [sortBy, sortOrder]);

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

  const handleToggleActive = async (target: UserItem) => {
    try {
      await toggleUserActive(target.id, !target.isActive);
      setConfirmToggleActive(null);
      fetchData();
    } catch { toast.error("Failed to update user status"); }
  };

  const handleChangePlan = async (userId: string, planId: string) => {
    try {
      await adminUpdateSubscription(userId, { planId, status: "active" });
      toast.success(t("billing.planUpdated"));
      setUserPlans((prev) => ({ ...prev, [userId]: planId }));
    } catch {
      toast.error(t("billing.planError"));
    }
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

      {changePlanUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setChangePlanUser(null)}
        >
          <div
            className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-body-bold text-heading mb-1">
              {t("admin.changePlan")}
            </h3>
            <p className="text-sm text-muted mb-4">
              {changePlanUser.firstName} {changePlanUser.lastName}
            </p>
            <div className="flex flex-col gap-1.5 mb-6">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body-medium transition-colors cursor-pointer ${
                    selectedPlanId === p.id
                      ? "bg-surface-active text-primary border border-primary/30"
                      : "text-secondary-text hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" color="light" onClick={() => setChangePlanUser(null)}>
                {t("admin.cancel")}
              </Button>
              <Button
                size="sm"
                disabled={!selectedPlanId || selectedPlanId === userPlans[changePlanUser.id]}
                onClick={async () => {
                  await handleChangePlan(changePlanUser.id, selectedPlanId);
                  setChangePlanUser(null);
                }}
              >
                {t("admin.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("admin.manageUsers")}</h2>
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
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
        <table className="w-full">
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
                      <span className="text-sm font-body-semibold text-heading">{u.firstName} {u.lastName}</span>
                    )}
                    {col.key === "email" && (
                      <span className="text-sm text-muted">{u.email}</span>
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
                    {col.key === "plan" && (
                      <span className="text-sm text-muted">
                        {plans.find((p) => p.id === userPlans[u.id])?.name ?? "—"}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-2 py-3 sticky right-0 bg-surface">
                  {u.id !== user.id && (
                    <ActionMenu items={[
                      {
                        label: u.isSystemAdmin ? t("admin.removeAdmin") : t("admin.makeAdmin"),
                        onClick: () => setConfirmToggleAdmin(u),
                      },
                      ...(saasMode ? [{
                        label: t("admin.changePlan"),
                        onClick: () => { setChangePlanUser(u); setSelectedPlanId(userPlans[u.id] ?? ""); },
                      }] : []),
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
    </div>
  );
}
