import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
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
  Department,
  DepartmentDetail,
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
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DepartmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [addMemberUserId, setAddMemberUserId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canManage = can(P.DEPARTMENT_MANAGE);

  const fetchDepartments = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listDepartments(workspaceSlug)
      .then(setDepartments)
      .catch(() => toast.error("Failed to load departments"))
      .finally(() => setLoading(false));
  };

  const fetchDetail = (id: string) => {
    if (!workspaceSlug) return;
    setDetailLoading(true);
    getDepartment(workspaceSlug, id)
      .then((d) => {
        setDetail(d);
        setEditName(d.name);
        setEditDescription(d.description);
      })
      .catch(() => toast.error("Failed to load department"))
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
    if (workspaceSlug) listMembers(workspaceSlug).then(setMembers);
  }, [workspaceSlug]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      setEditingId(null);
    } else {
      setExpandedId(id);
      setEditingId(null);
      fetchDetail(id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setCreating(true);
    try {
      await createDepartment(workspaceSlug, { name, description: description || undefined });
      setName("");
      setDescription("");
      setShowCreate(false);
      fetchDepartments();
      toast.success(t("departments.created"));
    } catch {
      toast.error("Failed to create department");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!workspaceSlug || !editingId) return;
    setSaving(true);
    try {
      await updateDepartment(workspaceSlug, editingId, { name: editName, description: editDescription });
      setEditingId(null);
      fetchDepartments();
      fetchDetail(editingId);
      toast.success(t("departments.updated"));
    } catch {
      toast.error("Failed to update department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteDepartment(workspaceSlug, deleteId);
      if (expandedId === deleteId) { setExpandedId(null); setDetail(null); }
      setDeleteId(null);
      fetchDepartments();
      toast.success(t("departments.deleted"));
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const handleAddMember = async () => {
    if (!workspaceSlug || !expandedId || !addMemberUserId) return;
    try {
      await addDepartmentMember(workspaceSlug, expandedId, addMemberUserId);
      setAddMemberUserId(null);
      fetchDetail(expandedId);
      toast.success(t("departments.agentAdded"));
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!workspaceSlug || !expandedId) return;
    try {
      await removeDepartmentMember(workspaceSlug, expandedId, userId);
      fetchDetail(expandedId);
      toast.success(t("departments.agentRemoved"));
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const agentRoles = ["admin", "supervisor", "agent"];
  const availableMembers = members.filter(
    (m) => agentRoles.includes(m.role) && !detail?.members.some((dm) => dm.userId === m.userId),
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">{t("departments.title")}</h2>
        {canManage && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            {t("departments.new")}
          </Button>
        )}
      </div>

      {showCreate && (
        <Sheet onClose={() => setShowCreate(false)}>
          <h2 className="text-lg font-body-bold text-heading mb-6">
            {t("departments.new")}
          </h2>
          <form onSubmit={handleCreate}>
            <FormInput label={t("departments.name")} required>
              <Input placeholder={t("departments.name")} value={name} onChange={setName} autoFocus />
            </FormInput>
            <FormInput label={t("departments.description")}>
              <Input placeholder={t("departments.description")} value={description} onChange={setDescription} />
            </FormInput>
            <div className="flex justify-end gap-3">
              <Button size="sm" color="light" onClick={() => setShowCreate(false)}>
                {t("tags.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={creating}>{t("departments.create")}</Button>
            </div>
          </form>
        </Sheet>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : departments.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("departments.empty")}</p>
      ) : (
        <div className="space-y-3">
          {departments.map((dept) => {
            const isExpanded = expandedId === dept.id;
            const isEditing = editingId === dept.id;

            return (
              <div key={dept.id} className="bg-surface border border-border-card rounded-lg overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => toggleExpand(dept.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg
                      className={`w-4 h-4 text-muted shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="min-w-0">
                      <span className="text-sm font-body-semibold text-heading">{dept.name}</span>
                      {dept.description && (
                        <span className="text-xs text-muted ml-2 hidden sm:inline">{dept.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-muted">{dept.memberCount ?? 0} {t("departments.agents").toLowerCase()}</span>
                    {canManage && (
                      <ActionMenu items={[
                        { label: t("ticketDetail.edit"), onClick: () => { setExpandedId(dept.id); fetchDetail(dept.id); setEditingId(dept.id); setEditName(dept.name); setEditDescription(dept.description ?? ""); } },
                        { label: t("common.delete"), onClick: () => setDeleteId(dept.id), danger: true },
                      ]} />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border-card px-4 py-4">
                    {detailLoading ? (
                      <div className="flex justify-center py-6"><Spinner width={20} /></div>
                    ) : detail ? (
                      <>
                        {/* Edit form */}
                        {isEditing && (
                          <div className="mb-4 pb-4 border-b border-border-card">
                            <div className="flex gap-3 items-end">
                              <div className="flex-1">
                                <FormInput label={t("departments.name")} required>
                                  <Input value={editName} onChange={setEditName} />
                                </FormInput>
                              </div>
                              <div className="flex-1">
                                <FormInput label={t("departments.description")}>
                                  <Input value={editDescription} onChange={setEditDescription} />
                                </FormInput>
                              </div>
                              <div className="flex gap-2 pb-4">
                                <Button size="sm" loading={saving} onClick={handleUpdate}>
                                  {t("departments.updated").split(" ")[0]}
                                </Button>
                                <Button size="sm" color="light" onClick={() => setEditingId(null)}>
                                  {t("tags.cancel")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Members section */}
                        <p className="text-xs font-body-semibold text-subtle uppercase mb-3">
                          {t("departments.agents")} ({detail.members.length})
                        </p>

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

                        {detail.members.length === 0 ? (
                          <p className="text-xs text-muted py-3">{t("members.empty")}</p>
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
                                {detail.members.map((m) => (
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
                                          className="text-xs text-muted hover:text-red-500 cursor-pointer transition-colors"
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
              </div>
            );
          })}
        </div>
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
    </div>
  );
}
