import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  type Department,
  type DepartmentDetail,
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addDepartmentMember,
  removeDepartmentMember,
} from "../services/department.service";
import {
  listMembers,
  type WorkspaceMember,
} from "@modules/workspace/services/workspace.service";

export default function WorkspaceDepartmentsPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state: null = closed, { mode: "create" } or { mode: "edit", dept, detail }
  const [sheet, setSheet] = useState<
    | { mode: "create" }
    | { mode: "edit"; dept: Department; detail: DepartmentDetail | null; detailLoading: boolean }
    | null
  >(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [addMemberUserId, setAddMemberUserId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);
  const [originalName, setOriginalName] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");

  const isDirty = name !== originalName || description !== originalDescription;

  const canManage = can(P.DEPARTMENT_MANAGE);

  const fetchDepartments = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listDepartments(workspaceSlug)
      .then(setDepartments)
      .catch(() => toast.error(t("common.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
    if (workspaceSlug) listMembers(workspaceSlug).then(setMembers);
  }, [workspaceSlug]);

  const openCreate = () => {
    setName("");
    setDescription("");
    setOriginalName("");
    setOriginalDescription("");
    setSheet({ mode: "create" });
  };

  const openEdit = (dept: Department) => {
    setName(dept.name);
    setDescription(dept.description ?? "");
    setOriginalName(dept.name);
    setOriginalDescription(dept.description ?? "");
    setSheet({ mode: "edit", dept, detail: null, detailLoading: true });
    if (workspaceSlug) {
      getDepartment(workspaceSlug, dept.id)
        .then((d) => setSheet((prev) => prev?.mode === "edit" ? { ...prev, detail: d, detailLoading: false } : prev))
        .catch(() => {
          toast.error(t("common.loadError"));
          setSheet((prev) => prev?.mode === "edit" ? { ...prev, detailLoading: false } : prev);
        });
    }
  };

  const closeSheet = () => {
    setSheet(null);
    setAddMemberUserId(null);
  };

  const handleClose = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      closeSheet();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !sheet) return;
    setSubmitting(true);
    try {
      if (sheet.mode === "create") {
        await createDepartment(workspaceSlug, { name, description: description || undefined });
        toast.success(t("departments.created"));
      } else {
        await updateDepartment(workspaceSlug, sheet.dept.id, { name, description: description || undefined });
        toast.success(t("departments.updated"));
      }
      closeSheet();
      fetchDepartments();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteDepartment(workspaceSlug, deleteId);
      if (sheet?.mode === "edit" && sheet.dept.id === deleteId) closeSheet();
      setDeleteId(null);
      fetchDepartments();
      toast.success(t("departments.deleted"));
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  const handleAddMember = async () => {
    if (!workspaceSlug || !sheet || sheet.mode !== "edit" || !addMemberUserId) return;
    try {
      await addDepartmentMember(workspaceSlug, sheet.dept.id, addMemberUserId);
      setAddMemberUserId(null);
      const d = await getDepartment(workspaceSlug, sheet.dept.id);
      setSheet((prev) => prev?.mode === "edit" ? { ...prev, detail: d } : prev);
      fetchDepartments();
      toast.success(t("departments.agentAdded"));
    } catch {
      toast.error(t("common.saveError"));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!workspaceSlug || !sheet || sheet.mode !== "edit") return;
    try {
      await removeDepartmentMember(workspaceSlug, sheet.dept.id, userId);
      const d = await getDepartment(workspaceSlug, sheet.dept.id);
      setSheet((prev) => prev?.mode === "edit" ? { ...prev, detail: d } : prev);
      fetchDepartments();
      toast.success(t("departments.agentRemoved"));
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  const agentRoles = ["admin", "supervisor", "agent"];
  const editDetail = sheet?.mode === "edit" ? sheet.detail : null;
  const availableMembers = members.filter(
    (m) => agentRoles.includes(m.role) && !editDetail?.members.some((dm) => dm.userId === m.userId),
  );

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <svg className="w-12 h-12 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6A1.125 1.125 0 012.25 10.875v-3.75zM13.5 7.125C13.5 6.504 14.004 6 14.625 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM7.5 16.125c0-.621.504-1.125 1.125-1.125h6.75c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125H8.625A1.125 1.125 0 017.5 19.875v-3.75z" />
          </svg>
          <p className="text-sm text-heading font-body-semibold mb-1">{t("departments.emptyTitle")}</p>
          <p className="text-xs text-muted mb-4 max-w-xs text-center">{t("departments.emptyDescription")}</p>
          {canManage && (
            <Button size="sm" onClick={openCreate}>{t("departments.new")}</Button>
          )}
        </div>
      ) : (
        <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-body-bold text-heading">
            {t("departments.title")} ({departments.length})
          </h2>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              {t("departments.new")}
            </Button>
          )}
        </div>
        <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("departments.name")}</th>
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase hidden md:table-cell">{t("departments.description")}</th>
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase w-24">{t("departments.agents")}</th>
                {canManage && <th className="px-2 py-2 w-10" />}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b border-border-row last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-body-medium text-heading">{dept.name}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    {dept.description ? (
                      <span className="text-sm text-muted truncate block max-w-xs">{dept.description}</span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-sm text-muted">{dept.memberCount ?? 0}</span>
                  </td>
                  {canManage && (
                    <td className="px-2 py-2.5 text-right">
                      <ActionMenu items={[
                        { label: t("common.edit"), onClick: () => openEdit(dept) },
                        { label: t("common.delete"), onClick: () => setDeleteId(dept.id), danger: true },
                      ]} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Create / Edit Sheet */}
      {sheet && (
        <Sheet onClose={handleClose}>
          <h2 className="text-lg font-body-bold text-heading mb-6">
            {sheet.mode === "create" ? t("departments.new") : t("departments.editTitle")}
          </h2>
          <form onSubmit={handleSubmit}>
            <FormInput label={t("departments.name")} required>
              <Input placeholder={t("departments.namePlaceholder")} value={name} onChange={setName} autoFocus />
            </FormInput>
            <FormInput label={t("departments.description")}>
              <Input placeholder={t("departments.descriptionPlaceholder")} value={description} onChange={setDescription} />
            </FormInput>
            <div className="flex justify-end gap-3">
              <Button type="button" size="sm" color="light" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={submitting}>
                {sheet.mode === "create" ? t("departments.create") : t("common.save")}
              </Button>
            </div>
          </form>

          {/* Members section (only in edit mode) */}
          {sheet.mode === "edit" && (
            <div className="mt-6 pt-6 border-t border-border-card">
              <p className="text-xs font-body-semibold text-subtle uppercase mb-3">
                {t("departments.agents")} ({editDetail?.members.length ?? 0})
              </p>

              {sheet.detailLoading ? (
                <div className="flex justify-center py-6"><Spinner width={20} /></div>
              ) : editDetail ? (
                <>
                  {canManage && (
                    availableMembers.length > 0 ? (
                      <div className="flex gap-2 mb-3">
                        <div className="flex-1">
                          <Select
                            options={availableMembers}
                            label={(m) => `${m.firstName} ${m.lastName} (${m.email})`}
                            value={(m) => m.userId === addMemberUserId}
                            onChange={(m) => setAddMemberUserId(m.userId)}
                            placeholder={t("departments.addAgent")}
                          />
                        </div>
                        <Button size="sm" disabled={!addMemberUserId} onClick={handleAddMember}>
                          {t("departments.addAgent")}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted mb-3">{t("departments.allAgentsAssigned")}</p>
                    )
                  )}

                  {editDetail.members.length === 0 ? (
                    <p className="text-xs text-muted py-3">{t("departments.noAgents")}</p>
                  ) : (
                    <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border-card bg-surface-hover">
                            <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
                            <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                            {canManage && <th className="px-2 py-2 w-10" />}
                          </tr>
                        </thead>
                        <tbody>
                          {editDetail.members.map((m) => (
                            <tr key={m.userId} className="border-b border-border-row last:border-0">
                              <td className="px-4 py-2">
                                <span className="text-sm font-body-medium text-heading">{m.firstName} {m.lastName}</span>
                              </td>
                              <td className="px-4 py-2">
                                <span className="text-sm text-muted">{m.email}</span>
                              </td>
                              {canManage && (
                                <td className="px-2 py-2 text-right">
                                  <button
                                    onClick={() => handleRemoveMember(m.userId)}
                                    className="text-xs text-muted hover:text-red-500 cursor-pointer transition-colors p-1"
                                    aria-label={t("departments.removeAgent")}
                                  >
                                    ✕
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("common.delete")}
          message={t("departments.confirmDelete")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showDiscard && (
        <ConfirmModal
          title={t("discard.title")}
          message={t("discard.message")}
          confirmLabel={t("discard.confirm")}
          danger
          onConfirm={() => { setShowDiscard(false); closeSheet(); }}
          onCancel={() => setShowDiscard(false)}
        />
      )}
    </div>
  );
}
