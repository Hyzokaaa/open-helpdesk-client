import { useState } from "react";
import { toast } from "react-toastify";
import {
  TicketDetail,
  updateTicket,
  changeTicketStatus,
  assignTicket,
} from "../services/ticket.service";
import { listCategories, type TicketCategoryDto, type Project } from "@modules/project/services/project.service";
import { getTicketChanges, type FieldChange, type ChangeLookups } from "../domain/get-ticket-changes";
import type { Tag } from "@modules/tag/services/tag.service";
import type { Department } from "@modules/department/services/department.service";
import type { Organization } from "@modules/organization/services/organization.service";
import type { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";

export interface Draft {
  name: string;
  description: string;
  priority: string;
  categoryId: string | null;
  projectId: string | null;
  status: string;
  assigneeId: string | null;
  tagIds: string[];
  departmentId: string | null;
  organizationId: string | null;
  customFields: Record<string, unknown>;
  discardReason?: string;
}

interface UseTicketEditOptions {
  workspaceSlug: string | undefined;
  ticketId: string | undefined;
  ticket: TicketDetail | null;
  wsCategories: TicketCategoryDto[];
  wsProjects: Project[];
  workspaceTags: Tag[];
  departments: Department[];
  organizations: Organization[];
  customFieldDefs: CustomFieldDefinition[];
  getMemberName: (id: string) => string;
  fetchTicket: (refreshActivity?: boolean) => void;
  getDescriptionHtml: () => string | null;
  onDirtyChange?: (dirty: boolean) => void;
  onClose?: () => void;
  navigate: (path: string) => void;
  handlePlanLimitError: (err: unknown, fallbackMessage: string) => void;
  t: (key: any) => string;
  tEnum: (prefix: string, value: string) => string;
  initialMode?: "view" | "edit";
}

export default function useTicketEdit(options: UseTicketEditOptions) {
  const {
    workspaceSlug, ticketId, ticket,
    wsCategories, wsProjects, workspaceTags, departments, organizations, customFieldDefs,
    getMemberName, fetchTicket, getDescriptionHtml,
    onDirtyChange, onClose, navigate, handlePlanLimitError,
    t, tEnum, initialMode = "view",
  } = options;

  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editCategories, setEditCategories] = useState<TicketCategoryDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showCloseReasonModal, setShowCloseReasonModal] = useState(false);

  const isEditing = mode === "edit";

  const enterEdit = () => {
    if (!ticket) return;
    if (workspaceSlug && ticket.projectId) {
      listCategories(workspaceSlug, ticket.projectId).then((cats) => {
        const inProject = cats.filter((c) => c.inProject);
        setEditCategories(inProject.length > 0 ? inProject : wsCategories);
      });
    } else {
      setEditCategories(wsCategories);
    }
    setDraft({
      name: ticket.name,
      description: ticket.description,
      priority: ticket.priority,
      categoryId: ticket.categoryId,
      projectId: ticket.projectId,
      status: ticket.status,
      assigneeId: ticket.assigneeId,
      tagIds: [...ticket.tagIds],
      departmentId: ticket.departmentId,
      organizationId: ticket.organizationId,
      customFields: { ...(ticket.customFields ?? {}) },
    });
    setMode("edit");
  };

  const getChanges = (): FieldChange[] => {
    if (!ticket || !draft) return [];
    return getTicketChanges(ticket, draft, {
      projects: wsProjects,
      categories: wsCategories,
      tags: workspaceTags,
      departments,
      organizations,
      customFieldDefs,
      getMemberName,
      t: t as (key: string) => string,
      tEnum,
    });
  };

  const isDirty = () => getChanges().length > 0;

  const cancelEdit = () => {
    if (isDirty()) {
      setShowDiscardModal(true);
      return;
    }
    setDraft(null);
    setMode("view");
  };

  const confirmDiscard = () => {
    setShowDiscardModal(false);
    setDraft(null);
    setMode("view");
  };

  const requestSave = () => {
    if (draft) {
      const html = getDescriptionHtml();
      if (html !== null) {
        setDraft((d) => d ? { ...d, description: html } : d);
        draft.description = html;
      }
    }
    const changes = getChanges();
    if (changes.length === 0) {
      setDraft(null);
      setMode("view");
      return;
    }
    setShowChangesModal(true);
  };

  const handleSave = async () => {
    if (!workspaceSlug || !ticketId || !ticket || !draft) return;
    setSaving(true);
    try {
      const updates: Partial<{ name: string; description: string; priority: string; categoryId: string | null; projectId: string | null; tagIds: string[]; departmentId: string | null; organizationId: string | null; customFields: Record<string, unknown> }> = {};
      if (draft.name !== ticket.name) updates.name = draft.name;
      if (draft.description !== ticket.description) updates.description = draft.description;
      if (draft.priority !== ticket.priority) updates.priority = draft.priority;
      if (draft.categoryId !== ticket.categoryId) updates.categoryId = draft.categoryId;
      if (draft.projectId !== ticket.projectId) updates.projectId = draft.projectId;
      if (JSON.stringify(draft.tagIds) !== JSON.stringify(ticket.tagIds)) updates.tagIds = draft.tagIds;
      if (draft.departmentId !== ticket.departmentId) updates.departmentId = draft.departmentId;
      if (draft.organizationId !== ticket.organizationId) updates.organizationId = draft.organizationId;
      if (JSON.stringify(draft.customFields) !== JSON.stringify(ticket.customFields ?? {})) updates.customFields = draft.customFields;

      if (Object.keys(updates).length > 0) {
        await updateTicket(workspaceSlug, ticketId, updates);
      }

      if (draft.status !== ticket.status) {
        await changeTicketStatus(workspaceSlug, ticketId, draft.status, draft.discardReason);
      }

      if (draft.assigneeId !== ticket.assigneeId) {
        await assignTicket(workspaceSlug, ticketId, draft.assigneeId);
      }

      fetchTicket(true);
      setMode("view");
      setDraft(null);
      toast.success(t("ticketDetail.updated"));
      onDirtyChange?.(true);
    } catch (err) {
      handlePlanLimitError(err, t("ticketDetail.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDraftStatusChange = (status: string) => {
    if (status === "discarded") {
      setShowCloseReasonModal(true);
      return;
    }
    setDraft((d) => d ? { ...d, status, discardReason: undefined } : d);
  };

  const closeDiscardModal = () => setShowDiscardModal(false);

  return {
    mode,
    draft, setDraft,
    editCategories, setEditCategories,
    saving,
    isEditing,
    showChangesModal, setShowChangesModal,
    showDiscardModal, closeDiscardModal,
    showCloseReasonModal, setShowCloseReasonModal,
    enterEdit,
    cancelEdit,
    confirmDiscard,
    requestSave,
    handleSave,
    handleDraftStatusChange,
    getChanges,
    isDirty,
  };
}
