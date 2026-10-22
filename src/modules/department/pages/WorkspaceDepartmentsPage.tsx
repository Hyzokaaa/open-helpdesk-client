import { useEffect, useRef, useState } from "react";
import { useMembershipChanged } from "@modules/workspace/domain/membership-events";
import useWorkspaceMembership from "@modules/workspace/hooks/useWorkspaceMembership";
import useUser from "@modules/user/hooks/useUser";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import EmptyState from "@modules/app/modules/ui/components/EmptyState/EmptyState";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  type Department,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  setDepartmentMembers,
} from "../services/department.service";
import {
  listMembers,
  type WorkspaceMember,
} from "@modules/workspace/services/workspace.service";
import AgentMultiSelect, { type AgentMultiSelectHandle } from "../components/AgentMultiSelect";
import { agentsChanged, initialsOf } from "../domain/department-agents";

type SheetState = { mode: "create" } | { mode: "edit"; dept: Department };

export default function WorkspaceDepartmentsPage() {
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { can } = usePermissions(workspaceSlug);
  const { needsJoin, join, joining } = useWorkspaceMembership(workspaceSlug);
  const agentsRef = useRef<AgentMultiSelectHandle>(null);
  const { t } = useTranslation();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [original, setOriginal] = useState({ name: "", description: "", agentIds: [] as string[] });
  const [submitting, setSubmitting] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const isDirty = name !== original.name || description !== original.description || agentsChanged(original.agentIds, agentIds);
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
  useMembershipChanged(workspaceSlug, () => { if (workspaceSlug) listMembers(workspaceSlug).then(setMembers); });

  const openSheet = (next: SheetState, focusAgents = false) => {
    const dept = next.mode === "edit" ? next.dept : null;
    const ids = dept?.members?.map((m) => m.userId) ?? [];
    setName(dept?.name ?? "");
    setDescription(dept?.description ?? "");
    setAgentIds(ids);
    setOriginal({ name: dept?.name ?? "", description: dept?.description ?? "", agentIds: ids });
    setSheet(next);
    if (focusAgents) requestAnimationFrame(() => agentsRef.current?.focus());
  };

  const closeSheet = () => setSheet(null);
  const handleClose = () => (isDirty ? setShowDiscard(true) : closeSheet());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !sheet) return;
    setSubmitting(true);
    try {
      if (sheet.mode === "create") {
        await createDepartment(workspaceSlug, { name, description: description || undefined, memberUserIds: agentIds });
        toast.success(t("departments.created"));
      } else {
        if (name !== original.name || description !== original.description) {
          await updateDepartment(workspaceSlug, sheet.dept.id, { name, description: description || undefined });
        }
        if (agentsChanged(original.agentIds, agentIds)) {
          await setDepartmentMembers(workspaceSlug, sheet.dept.id, agentIds);
        }
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

  // Names of chosen agents that may not be among the members (they left the workspace)
  const knownNames = Object.fromEntries(
    (sheet?.mode === "edit" ? sheet.dept.members ?? [] : []).map((m) => [m.userId, `${m.firstName} ${m.lastName}`]),
  );
  if (user) knownNames[user.id] = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  const joinOffer = needsJoin && user ? {
    label: t("departments.notMemberSelf"),
    joining,
    onJoin: async () => { if (await join()) setAgentIds((ids) => (ids.includes(user.id) ? ids : [...ids, user.id])); },
  } : undefined;

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : (
        <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-body-bold text-heading">
            {t("departments.title")} ({departments.length})
          </h2>
          {canManage && (
            <Button size="sm" onClick={() => openSheet({ mode: "create" })}>
              {t("departments.new")}
            </Button>
          )}
        </div>
        {departments.length === 0 ? (
          <EmptyState
            bordered
            icon="departments"
            title={t("emptyState.departments.title")}
            description={t("departments.emptyDescription")}
            action={canManage && <Button size="sm" onClick={() => openSheet({ mode: "create" })}>{t("departments.new")}</Button>}
          />
        ) : (
        <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("departments.name")}</th>
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase hidden md:table-cell">{t("departments.description")}</th>
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("departments.agents")}</th>
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
                    <AgentsCell dept={dept} canManage={canManage} onManage={() => openSheet({ mode: "edit", dept }, true)} />
                  </td>
                  {canManage && (
                    <td className="px-2 py-2.5 text-right">
                      <ActionMenu items={[
                        { label: t("common.edit"), onClick: () => openSheet({ mode: "edit", dept }) },
                        { label: t("departments.manageAgents"), onClick: () => openSheet({ mode: "edit", dept }, true) },
                        { label: t("common.delete"), onClick: () => setDeleteId(dept.id), danger: true },
                      ]} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        </>
      )}

      {/* Create / Edit Sheet: name, description and agents, all saved together */}
      {sheet && workspaceSlug && (
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
            <FormInput label={t("departments.agents")}>
              {canManage ? (
                <AgentMultiSelect
                  ref={agentsRef}
                  workspaceSlug={workspaceSlug}
                  members={members}
                  value={agentIds}
                  onChange={setAgentIds}
                  knownNames={knownNames}
                  join={joinOffer}
                  canInvite={can(P.WORKSPACE_INVITATIONS_MANAGE)}
                />
              ) : (
                <p className="text-sm text-muted">{agentIds.map((id) => knownNames[id]).filter(Boolean).join(", ") || t("departments.noAgentsChip")}</p>
              )}
              <p className="text-xs text-muted mt-1.5">{t("departments.agentsHelp")}</p>
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

/** The agents of a row: "No agents" with a way to add them, or their avatars and how many they are. */
function AgentsCell({ dept, canManage, onManage }: { dept: Department; canManage: boolean; onManage: () => void }) {
  const { t } = useTranslation();
  const count = dept.memberCount ?? 0;
  if (count === 0) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-800 border border-amber-200">
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5Zm0 7a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" /></svg>
          {t("departments.noAgentsChip")}
        </span>
        {canManage && (
          <button type="button" onClick={onManage} className="text-xs text-primary hover:underline cursor-pointer font-body-medium">
            + {t("departments.addAgents")}
            <span className="sr-only"> {t("departments.addAgentsTo").replace("{name}", dept.name)}</span>
          </button>
        )}
      </span>
    );
  }
  const shown = (dept.members ?? []).slice(0, 3);
  const label = count === 1 ? t("departments.agentCountOne") : t("departments.agentCount").replace("{count}", String(count));
  const content = (
    <>
      <span className="flex -space-x-1.5" aria-hidden="true">
        {shown.map((m) => (
          <span key={m.userId} title={`${m.firstName} ${m.lastName}`} className="w-6 h-6 rounded-full bg-surface-active text-primary text-exs font-body-bold flex items-center justify-center ring-2 ring-surface">
            {initialsOf(m.firstName, m.lastName)}
          </span>
        ))}
      </span>
      <span className="text-sm text-muted">{label}</span>
    </>
  );
  return canManage ? (
    <button
      type="button"
      onClick={onManage}
      aria-label={`${label} · ${t("departments.manageAgents")} · ${dept.name}`}
      className="inline-flex items-center gap-2 cursor-pointer rounded hover:underline"
    >
      {content}
    </button>
  ) : (
    <span className="inline-flex items-center gap-2">{content}</span>
  );
}
