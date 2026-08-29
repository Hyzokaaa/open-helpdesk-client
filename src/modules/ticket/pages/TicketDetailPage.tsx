import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import clsx from "clsx";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import MiniEditor, { MiniEditorRef } from "@modules/app/modules/ui/components/MiniEditor/MiniEditor";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import CommentInput from "@modules/comment/components/CommentInput";
import { CannedResponse, listCannedResponses } from "@modules/canned-response/services/canned-response.service";
import { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";
import { listCustomFields } from "@modules/custom-field/services/custom-field.service";
import CustomFieldsForm from "@modules/custom-field/components/CustomFieldsForm";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
import useExtensions from "@modules/app/extensions/useExtensions";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import {
  TicketParticipant,
  listParticipants,
  removeParticipant,
} from "../services/ticket.service";
import {
  TicketDetail,
  PendingTransfer,
  getTicket,
  updateTicket,
  changeTicketStatus,
  assignTicket,
  transferTicket,
  deleteTicket,
  getPendingTransfer,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
} from "../services/ticket.service";
import {
  STATUSES,
  PRIORITIES,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "../domain/ticket-enums";
import { listCategories, listProjects, type TicketCategoryDto, type Project } from "@modules/project/services/project.service";
import {
  CommentItem,
  listComments,
  createComment,
  editComment,
  getCommentHistory,
} from "@modules/comment/services/comment.service";
import { getDescriptionHistory } from "../services/ticket.service";
import VersionHistoryModal from "@modules/shared/components/VersionHistoryModal";
import {
  AttachmentDetail,
  uploadToTicket,
  listTicketAttachments,
  deleteAttachment,
} from "@modules/attachment/services/attachment.service";
import {
  WorkspaceMember,
  listMembers,
  SlaPolicy,
  getSlaPolicy,
} from "@modules/workspace/services/workspace.service";
import { Tag, listTags } from "@modules/tag/services/tag.service";
import { Department, listDepartments } from "@modules/department/services/department.service";
import { Organization, listOrganizations } from "@modules/organization/services/organization.service";
import TagSelector from "@modules/tag/components/TagSelector";
import useWebSocket from "@modules/shared/hooks/useWebSocket";
import DropZone from "@modules/app/modules/ui/components/DropZone/DropZone";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import { improveText, translateText, saveAiCache, clearAiCache } from "@modules/ai/services/ai.service";
import TicketActivityFeed from "@modules/audit-log/components/TicketActivityFeed";
import useFormatDate from "@modules/app/hooks/useFormatDate";

function MemberLink({ userId, members, getMemberName, navigate, workspaceSlug }: {
  userId: string;
  members: { userId: string; firstName: string; lastName: string; email: string; role: string }[];
  getMemberName: (id: string) => string;
  navigate: (path: string) => void;
  workspaceSlug?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const m = members.find((m) => m.userId === userId);

  const handleEnter = () => {
    if (!ref.current || !m) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right,
    });
    setShow(true);
  };

  return (
    <span className="text-right min-w-0">
      <button
        ref={ref}
        onClick={() => workspaceSlug && navigate(`/dashboard/workspaces/${workspaceSlug}/stats/${userId}`)}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        className="text-body font-body-medium truncate block cursor-pointer hover:text-primary transition-colors text-right"
      >
        {getMemberName(userId)}
      </button>
      {show && m && createPortal(
        <div
          className="fixed z-[9999] bg-surface border border-border-card rounded-lg shadow-lg p-3 min-w-[200px] text-left pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: "translateX(-100%)" }}
        >
          <p className="text-sm font-body-semibold text-heading">{m.firstName} {m.lastName}</p>
          <p className="text-xs text-muted mt-0.5">{m.email}</p>
          {m.role && <p className="text-xs text-subtle mt-1 capitalize">{m.role}</p>}
        </div>,
        document.body,
      )}
    </span>
  );
}

function formatResponseTime(createdAt: string, firstResponseAt: string): string {
  const ms = new Date(firstResponseAt).getTime() - new Date(createdAt).getTime();
  if (ms < 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function SlaStatusCard({
  ticket,
  slaPolicy,
  t,
  isTerminal,
}: {
  ticket: TicketDetail;
  slaPolicy: SlaPolicy;
  t: (key: any) => string;
  isTerminal: boolean;
}) {
  const priority = ticket.priority as "critical" | "high" | "medium" | "low";
  const frTarget = slaPolicy.firstResponse[priority];
  const resTarget = slaPolicy.resolution[priority];

  if (frTarget === null && resTarget === null) return null;

  const formatRemaining = (ms: number) => {
    if (ms <= 0) return null;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${t("ticketDetail.slaRemaining")}`;
    return `${minutes}m ${t("ticketDetail.slaRemaining")}`;
  };

  const getSlaStatus = (
    targetHours: number | null,
    breached: boolean,
    completedAt: string | null,
  ): { label: string; color: string } | null => {
    if (targetHours === null) return null;

    if (breached) {
      return { label: t("ticketDetail.slaBreached"), color: "text-red-500" };
    }

    if (completedAt) {
      return { label: t("ticketDetail.slaMet"), color: "text-green-500" };
    }

    if (isTerminal) {
      return { label: "—", color: "text-muted" };
    }

    // Pending: calculate remaining time
    if (ticket.createdAt) {
      const deadline = new Date(ticket.createdAt).getTime() + targetHours * 3600000;
      const remaining = deadline - Date.now();
      const formatted = formatRemaining(remaining);
      if (formatted) {
        return { label: formatted, color: remaining < targetHours * 3600000 * 0.25 ? "text-amber-500" : "text-muted" };
      }
    }

    return null;
  };

  const frStatus = getSlaStatus(frTarget, ticket.firstResponseBreached, ticket.firstResponseAt);
  const resStatus = getSlaStatus(resTarget, ticket.resolutionBreached, ticket.resolvedAt);

  if (!frStatus && !resStatus) return null;

  return (
    <Card className="p-4">
      <p className="text-xs text-subtle font-body-medium mb-2">
        {t("ticketDetail.slaTarget")}
      </p>
      <div className="space-y-2 text-xs">
        {frStatus && frTarget !== null && (
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("ticketDetail.slaFirstResponse")} ({frTarget}h)</span>
            <span className={`font-body-medium flex items-center gap-1.5 ${frStatus.color}`}>
              {ticket.firstResponseBreached && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {frStatus.label}
            </span>
          </div>
        )}
        {resStatus && resTarget !== null && (
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("ticketDetail.slaResolution")} ({resTarget}h)</span>
            <span className={`font-body-medium flex items-center gap-1.5 ${resStatus.color}`}>
              {ticket.resolutionBreached && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {resStatus.label}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

interface Props {
  workspaceSlugProp?: string;
  ticketIdProp?: string;
  onClose?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  initialMode?: "view" | "edit";
}

export default function TicketDetailPage({ workspaceSlugProp, ticketIdProp, onClose, onDirtyChange, initialMode = "view" }: Props = {}) {
  const params = useParams();
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const ticketId = ticketIdProp || params.ticketId;
  const { user } = useUser();
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const { isPlanLimitError, handlePlanLimitError } = useExtensions();
  const { aiEnabled } = useConfig();
  const formatDate = useFormatDate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionEditorRef = useRef<MiniEditorRef>(null);
  const commentEditorRef = useRef<MiniEditorRef>(null);

  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDetail[]>([]);
  const [participants, setParticipants] = useState<TicketParticipant[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [wsCategories, setWsCategories] = useState<TicketCategoryDto[]>([]);
  const [wsProjects, setWsProjects] = useState<Project[]>([]);
  const [editCategories, setEditCategories] = useState<TicketCategoryDto[]>([]);
  const [slaPolicy, setSlaPolicy] = useState<SlaPolicy | null>(null);
  const [slaLocked, setSlaLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [showCloseReasonModal, setShowCloseReasonModal] = useState(false);
  const [activityKey, setActivityKey] = useState(0);
  const [detailTab, setDetailTab] = useState<"details" | "activity">("details");
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ type: "comment" | "description"; commentId?: string } | null>(null);
  const [historyItems, setHistoryItems] = useState<Array<{ id: string; content: string; editorName: string; createdAt: string }> | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  interface Draft {
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
  const [draft, setDraft] = useState<Draft | null>(null);

  const enterEdit = () => {
    if (!ticket) return;
    // Load categories filtered by project for edit mode
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

  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const getChanges = (): { field: string; from: string; to: string }[] => {
    if (!ticket || !draft) return [];
    const changes: { field: string; from: string; to: string }[] = [];
    if (draft.name !== ticket.name) changes.push({ field: t("ticketDetail.name"), from: ticket.name, to: draft.name });
    if (draft.description !== ticket.description) changes.push({ field: t("ticketDetail.description"), from: ticket.description.slice(0, 50) + (ticket.description.length > 50 ? "..." : ""), to: draft.description.slice(0, 50) + (draft.description.length > 50 ? "..." : "") });
    if (draft.status !== ticket.status) changes.push({ field: t("ticketDetail.status"), from: tEnum("status", ticket.status), to: tEnum("status", draft.status) });
    if (draft.priority !== ticket.priority) changes.push({ field: t("ticketDetail.priority"), from: tEnum("priority", ticket.priority), to: tEnum("priority", draft.priority) });
    if (draft.projectId !== ticket.projectId) changes.push({ field: t("ticketDetail.project"), from: wsProjects.find((p) => p.id === ticket.projectId)?.name ?? "—", to: wsProjects.find((p) => p.id === draft.projectId)?.name ?? "—" });
    if (draft.categoryId !== ticket.categoryId) changes.push({ field: t("ticketDetail.category"), from: wsCategories.find((c) => c.id === ticket.categoryId)?.name ?? "—", to: wsCategories.find((c) => c.id === draft.categoryId)?.name ?? "—" });
    if (draft.assigneeId !== ticket.assigneeId) changes.push({ field: t("ticketDetail.assignee"), from: ticket.assigneeId ? getMemberName(ticket.assigneeId) : "—", to: draft.assigneeId ? getMemberName(draft.assigneeId) : "—" });
    if (JSON.stringify(draft.tagIds) !== JSON.stringify(ticket.tagIds)) changes.push({ field: t("ticketDetail.tags"), from: ticket.tagIds.map((id) => workspaceTags.find((t) => t.id === id)?.name ?? id).join(", ") || "—", to: draft.tagIds.map((id) => workspaceTags.find((t) => t.id === id)?.name ?? id).join(", ") || "—" });
    if (draft.departmentId !== ticket.departmentId) changes.push({ field: t("ticketDetail.department"), from: departments.find((d) => d.id === ticket.departmentId)?.name ?? "—", to: departments.find((d) => d.id === draft.departmentId)?.name ?? "—" });
    if (draft.organizationId !== ticket.organizationId) changes.push({ field: t("ticketDetail.organization"), from: organizations.find((o) => o.id === ticket.organizationId)?.name ?? "—", to: organizations.find((o) => o.id === draft.organizationId)?.name ?? "—" });
    const origCf = ticket.customFields ?? {};
    for (const def of customFieldDefs) {
      const origVal = origCf[def.id];
      const draftVal = draft.customFields[def.id];
      if (JSON.stringify(origVal) !== JSON.stringify(draftVal)) {
        const fmt = (v: unknown) => v === undefined || v === null || v === "" ? "—" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
        changes.push({ field: def.name, from: fmt(origVal), to: fmt(draftVal) });
      }
    }
    return changes;
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
    if (descriptionEditorRef.current && draft) {
      const html = descriptionEditorRef.current.getHTML();
      setDraft((d) => d ? { ...d, description: html } : d);
      draft.description = html;
    }
    const changes = getChanges();
    if (changes.length === 0) {
      setDraft(null);
      setMode("view");
      return;
    }
    setShowChangesModal(true);
  };

  const fetchTicket = (refreshActivity = false) => {
    if (!workspaceSlug || !ticketId) return;
    getTicket(workspaceSlug, ticketId)
      .then((t) => {
        setTicket(t);
        if (refreshActivity) setActivityKey((k) => k + 1);
        getPendingTransfer(workspaceSlug, ticketId).then(setPendingTransfer).catch(() => setPendingTransfer(null));
      })
      .catch(() => toast.error("Ticket not found"))
      .finally(() => setLoading(false));
  };

  const fetchComments = () => {
    if (!workspaceSlug || !ticketId) return;
    listComments(workspaceSlug, ticketId).then((res) =>
      setComments(res.items),
    );
  };

  const fetchAttachments = () => {
    if (!workspaceSlug || !ticketId) return;
    listTicketAttachments(workspaceSlug, ticketId).then(setAttachments);
  };

  const fetchMembers = () => {
    if (!workspaceSlug) return;
    listMembers(workspaceSlug).then(setMembers);
  };

  const fetchParticipants = () => {
    if (!workspaceSlug || !ticketId) return;
    listParticipants(workspaceSlug, ticketId).then(setParticipants).catch(() => {});
  };

  useEffect(() => {
    fetchTicket();
    fetchComments();
    fetchAttachments();
    fetchMembers();
    fetchParticipants();
    if (workspaceSlug) listTags(workspaceSlug).then(setWorkspaceTags);
    if (workspaceSlug) listDepartments(workspaceSlug).then(setDepartments).catch(() => {});
    if (workspaceSlug) listOrganizations(workspaceSlug).then(setOrganizations).catch(() => {});
    if (workspaceSlug) listCustomFields(workspaceSlug).then(setCustomFieldDefs).catch(() => {});
    if (workspaceSlug) listCategories(workspaceSlug).then(setWsCategories).catch(() => {});
    if (workspaceSlug) listProjects(workspaceSlug).then(setWsProjects).catch(() => {});
    if (workspaceSlug) getSlaPolicy(workspaceSlug, { silent: true }).then((r) => { setSlaPolicy(r.slaPolicy); setSlaLocked(false); }).catch((err) => { if (isPlanLimitError(err)) setSlaLocked(true); });
  }, [workspaceSlug, ticketId]);

  useWebSocket(workspaceSlug, {
    "ticket.statusChanged": (data) => {
      if (data.ticketId === ticketId) fetchTicket(true);
    },
    "ticket.assigned": (data) => {
      if (data.ticketId === ticketId) fetchTicket(true);
    },
    "comment.created": (data) => {
      if (data.ticketId === ticketId) {
        fetchComments();
        fetchTicket(true);
      }
    },
  });

  const handleDroppedFiles = useCallback(
    async (newFiles: File[]) => {
      if (!workspaceSlug || !ticketId) return;
      for (const file of newFiles) {
        try {
          await uploadToTicket(workspaceSlug, ticketId, file);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      fetchAttachments();
      toast.info(`${newFiles.length} file(s) uploaded`);
    },
    [workspaceSlug, ticketId],
  );

  const { can } = usePermissions(workspaceSlug);

  useEffect(() => {
    if (workspaceSlug && can(P.CANNED_RESPONSE_VIEW)) {
      listCannedResponses(workspaceSlug, { silent: true }).then(setCannedResponses).catch(() => {});
    }
  }, [workspaceSlug, can(P.CANNED_RESPONSE_VIEW)]);

  const isCreator = ticket?.reporterId === user?.id;
  const isTerminal = ticket?.status === "discarded" || ticket?.status === "resolved";
  const isEditing = mode === "edit";
  const isReadonly = ticket?.accessLevel === "readonly";

  const canChangeStatus = isEditing && !isReadonly && (isTerminal ? can(P.TICKET_CHANGE_STATUS_DISCARDED) : can(P.TICKET_CHANGE_STATUS));
  const canEditFields = isEditing && !isReadonly && (isTerminal ? can(P.TICKET_EDIT_DISCARDED) : can(P.TICKET_EDIT_DESCRIPTION));
  const canEditName = isEditing && !isReadonly && can(P.TICKET_EDIT_NAME);
  const canAssign = isEditing && !isReadonly && can(P.TICKET_ASSIGN);
  const canTransfer = !isReadonly && can(P.TICKET_TRANSFER) && !can(P.TICKET_ASSIGN) && ticket && (ticket.assigneeId === user?.id || ticket.reporterId === user?.id);
  const canDelete = isEditing && !isReadonly && can(P.TICKET_DELETE);
  const canEditTags = isEditing && !isReadonly && (isTerminal ? can(P.TICKET_EDIT_DISCARDED) : can(P.TICKET_EDIT_TAGS));
  const canEditCustomFields = isEditing && !isReadonly && can(P.TICKET_EDIT_DESCRIPTION);
  const canSwitchToEdit = !isReadonly && mode === "view" && (
    can(P.TICKET_EDIT_DESCRIPTION) || can(P.TICKET_EDIT_NAME) || can(P.TICKET_ASSIGN)
  );

  const assignableMembers = members.filter(
    (m) => m.role === "admin" || m.role === "agent",
  );

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.userId === userId);
    return m ? `${m.firstName} ${m.lastName}` : userId;
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
      toast.success("Ticket updated");
      onDirtyChange?.(true);
    } catch (err) {
      handlePlanLimitError(err, "Failed to save ticket");
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

  const handleDelete = () => {
    setConfirmAction({
      title: t("ticketDetail.deleteTitle"),
      message: t("ticketDetail.deleteMessage"),
      onConfirm: async () => {
        if (!workspaceSlug || !ticketId) return;
        try {
          await deleteTicket(workspaceSlug, ticketId);
          toast.success("Ticket deleted");
          if (onClose) onClose();
          else navigate(`/dashboard/workspaces/${workspaceSlug}/tickets`);
        } catch {
          toast.error("Failed to delete ticket");
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleAddComment = async (content: string) => {
    if (!workspaceSlug || !ticketId) return;
    setSendingComment(true);
    try {
      await createComment(workspaceSlug, ticketId, content);
      fetchComments();
      fetchParticipants();
      setActivityKey((k) => k + 1);
    } catch (err) {
      handlePlanLimitError(err, "Failed to add comment");
    } finally {
      setSendingComment(false);
    }
  };

  const handleAddCommentAndResolve = async (content: string) => {
    if (!workspaceSlug || !ticketId) return;
    setSendingComment(true);
    try {
      await createComment(workspaceSlug, ticketId, content);
      await changeTicketStatus(workspaceSlug, ticketId, "resolved");
      fetchTicket();
      fetchComments();
      fetchParticipants();
      setActivityKey((k) => k + 1);
      toast.success(t("ticketDetail.resolvedSuccess"));
    } catch (err) {
      handlePlanLimitError(err, "Failed to send and resolve");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setConfirmAction({
      title: t("ticketDetail.deleteAttachmentTitle"),
      message: t("ticketDetail.deleteAttachmentMessage"),
      onConfirm: async () => {
        try {
          await deleteAttachment(attachmentId);
          fetchAttachments();
          toast.success("Attachment deleted");
        } catch {
          toast.error("Failed to delete attachment");
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceSlug || !ticketId || !e.target.files?.[0]) return;
    try {
      await uploadToTicket(workspaceSlug, ticketId, e.target.files[0]);
      toast.success("File uploaded");
      fetchAttachments();
    } catch {
      toast.error("Upload failed");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");
  const isVideo = (mimeType: string) => mimeType.startsWith("video/");

  const handleEditComment = async (commentId: string) => {
    if (!workspaceSlug || !ticketId) return;
    const content = commentEditorRef.current?.getHTML() || editingCommentContent;
    setSavingComment(true);
    try {
      const updated = await editComment(workspaceSlug, ticketId, commentId, content);
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content: updated.content, editedAt: updated.editedAt } : c));
      setEditingCommentId(null);
      setEditingCommentContent("");
      toast.success(t("common.save"));
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSavingComment(false);
    }
  };

  const openHistory = async (type: "comment" | "description", commentId?: string) => {
    if (!workspaceSlug || !ticketId) return;
    setHistoryModal({ type, commentId });
    setHistoryItems(null);
    try {
      const edits = type === "comment" && commentId
        ? await getCommentHistory(workspaceSlug, ticketId, commentId)
        : await getDescriptionHistory(workspaceSlug, ticketId);
      setHistoryItems(edits.map((e) => ({
        id: e.id,
        content: e.content,
        editorName: getMemberName(e.editedById),
        createdAt: e.createdAt,
      })));
    } catch {
      setHistoryItems([]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner width={24} />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="w-full max-w-3xl">

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={t("ticketDetail.deleteConfirm")}
          danger
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {showDiscardModal && (
        <ConfirmModal
          title={t("ticketDetail.discardChangesTitle")}
          message={t("ticketDetail.discardChangesMessage")}
          confirmLabel={t("ticketDetail.discardChangesConfirm")}
          danger
          onConfirm={confirmDiscard}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}

      {showTransferModal && workspaceSlug && ticketId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTransferModal(false)} />
          <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-body-bold text-heading mb-1">{t("tickets.transferTitle")}</h3>
            <p className="text-sm text-muted mb-4">{t("tickets.transferMessage")}</p>
            <Select
              options={assignableMembers.filter((m) => m.userId !== user?.id)}
              label={(m) => `${m.firstName} ${m.lastName}`}
              value={(m) => m.userId === transferTarget}
              onChange={(m) => setTransferTarget(m.userId)}
              placeholder={t("ticketDetail.selectAssignee")}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button size="sm" color="light" onClick={() => setShowTransferModal(false)}>{t("ticketDetail.cancel")}</Button>
              <Button size="sm" color="primary" disabled={!transferTarget} onClick={async () => {
                try {
                  await transferTicket(workspaceSlug, ticketId, transferTarget!);
                  toast.success(t("tickets.transferred"));
                  fetchTicket(true);
                } catch { toast.error("Failed"); }
                setShowTransferModal(false);
              }}>{t("tickets.transfer")}</Button>
            </div>
          </div>
        </div>
      )}

      {showChangesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowChangesModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-body-bold text-heading mb-4">{t("ticketDetail.reviewChangesTitle")}</h3>
            <table className="w-full text-sm mb-4" style={{ borderSpacing: "0 4px" }}>
              <thead>
                <tr className="text-left text-xs text-subtle border-b border-border-row">
                  <th className="pb-2 pr-6 font-body-medium">{t("ticketDetail.field")}</th>
                  <th className="pb-2 pr-6 font-body-medium">{t("ticketDetail.from")}</th>
                  <th className="pb-2 font-body-medium">{t("ticketDetail.to")}</th>
                </tr>
              </thead>
              <tbody>
                {getChanges().map((c) => (
                  <tr key={c.field} className="border-b border-border-row last:border-0">
                    <td className="py-2.5 pr-6 text-muted font-body-medium whitespace-nowrap">{c.field}</td>
                    <td className="py-2.5 pr-6 text-body line-through opacity-50">{c.from || "—"}</td>
                    <td className="py-2.5 text-body font-body-semibold">{c.to || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-2">
              <Button size="xs" color="light" onClick={() => setShowChangesModal(false)}>{t("ticketDetail.cancel")}</Button>
              <Button size="xs" color="primary" loading={saving} onClick={() => { setShowChangesModal(false); handleSave(); }}>{t("ticketDetail.confirmSave")}</Button>
            </div>
          </div>
        </div>
      )}

      {showCloseReasonModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowCloseReasonModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-body-bold text-heading mb-1">{t("ticketDetail.discardReasonTitle")}</h3>
            <p className="text-sm text-muted mb-4">{t("ticketDetail.discardReasonMessage")}</p>
            <div className="flex flex-col gap-2">
              {(["duplicate", "spam", "no-response", "wont-fix"] as const).map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setShowCloseReasonModal(false);
                    setDraft((d) => d ? { ...d, status: "discarded", discardReason: reason } : d);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-sm hover:bg-surface-hover transition-colors cursor-pointer text-body"
                >
                  {tEnum("discardReason", reason)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCloseReasonModal(false)}
              className="mt-3 text-xs text-subtle hover:text-secondary-text cursor-pointer"
            >
              {t("cannedResponses.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-end mb-2 gap-2">
          {isEditing ? (
            <>
              <Button size="xs" color="light" onClick={cancelEdit}>{t("ticketDetail.cancel")}</Button>
              <Button size="xs" color="primary" onClick={requestSave} loading={saving}>{t("ticketDetail.save")}</Button>
            </>
          ) : canSwitchToEdit ? (
            <Button size="xs" onClick={enterEdit}>{t("ticketDetail.edit")}</Button>
          ) : null}
        </div>
        {isEditing && draft && canEditName ? (
          <Input
            value={draft.name}
            onChange={(v) => setDraft((d) => d ? { ...d, name: v } : d)}
            autoFocus
            size="lg"
          />
        ) : (
          <h2 className="text-lg font-body-bold text-heading"><span className="text-muted font-body-medium">#{ticket.ticketNumber}</span> {ticket.name}</h2>
        )}
        {!isEditing && (
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge
              label={tEnum("status", ticket.status)}
              color={STATUS_COLORS[ticket.status] || "gray"}
            />
            <StatusBadge
              label={tEnum("priority", ticket.priority)}
              color={PRIORITY_COLORS[ticket.priority] || "gray"}
            />
            {(() => { const cat = wsCategories.find((c) => c.id === ticket.categoryId); return <StatusBadge label={cat?.name ?? "—"} color={(cat?.color as any) || "primary"} size="xs" />; })()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs: Details / Activity */}
          <div className="flex border-b border-border-card">
            <button
              className={`px-4 py-2 text-sm font-body-semibold cursor-pointer border-b-2 transition-colors ${detailTab === "details" ? "border-primary text-primary" : "border-transparent text-muted hover:text-heading"}`}
              onClick={() => setDetailTab("details")}
            >
              {t("ticketDetail.tabDetails")}
            </button>
            <button
              className={`px-4 py-2 text-sm font-body-semibold cursor-pointer border-b-2 transition-colors ${detailTab === "activity" ? "border-primary text-primary" : "border-transparent text-muted hover:text-heading"}`}
              onClick={() => setDetailTab("activity")}
            >
              {t("ticketDetail.tabActivity")}
            </button>
          </div>

          {detailTab === "details" ? (
          <>
          <Card className="p-5">
            <p className="text-xs font-body-medium text-subtle uppercase mb-2">
              {t("ticketDetail.description")}
            </p>
            {isEditing && draft && canEditFields ? (
              <MiniEditor
                ref={descriptionEditorRef}
                initialValue={draft.description}
                placeholder={t("ticketCreate.descriptionPlaceholder")}
                minHeight={120}
              />
            ) : (
              <>
                <div
                  className="text-sm text-body break-words overflow-hidden tiptap"
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                />
                {ticket.descriptionEditedAt && (
                  <button
                    onClick={() => openHistory("description")}
                    className="text-exs text-muted hover:text-primary mt-1 cursor-pointer"
                  >
                    {t("ticketDetail.edited")} {formatDate(ticket.descriptionEditedAt)}
                  </button>
                )}
                {aiEnabled && !isReadonly && (() => {
                  const targetLang = user?.language === "es" ? "Spanish" : "English";
                  const slug = workspaceSlug ?? "";
                  const actions = [
                    { key: "improve", label: t("ticketDetail.aiImprove"), action: () => improveText(ticket.description, slug) },
                    { key: `translate:${targetLang}`, label: t("ticketDetail.aiTranslate"), action: () => translateText(ticket.description, slug, targetLang) },
                  ];
                  const cache = ticket.aiCache ?? {};
                  const cachedEntries = Object.entries(cache).filter(([, v]) => v.source === ticket.description);

                  return (
                    <>
                      <div className="flex gap-3 mt-3 pt-3 border-t border-border-row">
                        {actions.map((item) => (
                          <button
                            key={item.key}
                            onClick={async () => {
                              if (aiProcessing) return;
                              setAiProcessing(item.key);
                              try {
                                const result = await item.action();
                                if (workspaceSlug && ticketId) {
                                  await saveAiCache(workspaceSlug, ticketId, item.key, ticket.description, result);
                                  fetchTicket();
                                }
                              } catch { /* ignore */ }
                              finally { setAiProcessing(null); }
                            }}
                            disabled={!!aiProcessing}
                            className="text-exs text-muted hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                            {aiProcessing === item.key ? t("ticketDetail.aiProcessing") : item.label}
                          </button>
                        ))}
                      </div>
                      {cachedEntries.map(([key, entry]) => (
                        <div key={key} className="mt-3 p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-exs font-body-semibold text-primary">{t("ticketDetail.aiResult")}</p>
                            <button
                              onClick={async () => {
                                if (workspaceSlug && ticketId) {
                                  await clearAiCache(workspaceSlug, ticketId, key);
                                  fetchTicket();
                                }
                              }}
                              className="text-exs text-muted hover:text-danger cursor-pointer"
                            >
                              {t("ticketDetail.aiDismiss")}
                            </button>
                          </div>
                          <p className="text-sm text-body whitespace-pre-wrap">{entry.result}</p>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </>
            )}
          </Card>

          {/* Comments */}
          <div>
            <p className="text-sm font-body-semibold text-body mb-3">
              {t("ticketDetail.comments")} ({comments.length})
            </p>

            <div className="space-y-2 mb-4">
              {comments.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-exs text-subtle">{getMemberName(c.authorId)}</p>
                      {c.editedAt && (
                        <button
                          onClick={() => openHistory("comment", c.id)}
                          className="text-exs text-muted hover:text-primary cursor-pointer"
                        >
                          ({t("ticketDetail.edited")})
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.createdAt && <p className="text-exs text-subtle">{formatDate(c.createdAt)}</p>}
                      {!isReadonly && (c.authorId === user?.id || can(P.TICKET_EDIT_DESCRIPTION)) && editingCommentId !== c.id && (
                        <button
                          onClick={() => { setEditingCommentId(c.id); setEditingCommentContent(c.content); }}
                          className="text-exs text-muted hover:text-primary cursor-pointer"
                          title={t("ticketDetail.editComment")}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {editingCommentId === c.id ? (
                    <div>
                      <MiniEditor
                        ref={commentEditorRef}
                        initialValue={editingCommentContent}
                        minHeight={80}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => { setEditingCommentId(null); setEditingCommentContent(""); }} className="text-xs text-muted hover:text-body cursor-pointer">
                          {t("ticketDetail.cancelEdit")}
                        </button>
                        <button
                          onClick={() => handleEditComment(c.id)}
                          disabled={savingComment}
                          className="text-xs text-primary hover:text-primary-700 font-body-medium cursor-pointer disabled:opacity-50"
                        >
                          {savingComment ? "..." : t("ticketDetail.saveEdit")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`text-sm text-body ${c.content.startsWith('<') ? 'tiptap' : 'whitespace-pre-wrap'}`}
                      dangerouslySetInnerHTML={{
                        __html: c.content.replace(
                          /@\[([^\]]+)\]\(([^)]+)\)/g,
                          (_match, _name, userId) => {
                            const current = members.find((m) => m.userId === userId);
                            const displayName = current ? `${current.firstName} ${current.lastName}` : _name;
                            return `<span class="inline-block bg-primary-50 text-primary font-body-semibold rounded px-0.5 mx-0.5">@${displayName}</span>`;
                          },
                        ),
                      }}
                    />
                  )}
                </Card>
              ))}
            </div>

            {!isReadonly && (
              <CommentInput
                members={members}
                loading={sendingComment}
                onSubmit={handleAddComment}
                onSubmitAndResolve={handleAddCommentAndResolve}
                canResolve={!isTerminal && can(P.TICKET_CHANGE_STATUS)}
                cannedResponses={cannedResponses}
              />
            )}
          </div>

          {/* Attachments */}
          <Card className="p-5">
            <p className="text-xs font-body-medium text-subtle uppercase mb-3">
              {t("ticketDetail.attachments")} ({attachments.length})
            </p>
            {!isReadonly && (
              <DropZone onFiles={handleDroppedFiles} accept={["image/*", "video/*"]} dropHint={t("drop.hint")}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-exs text-subtle">
                    {t("ticketCreate.pasteOrDrag")}
                  </span>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleUpload}
                    />
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t("ticketDetail.addFile")}
                    </Button>
                  </div>
                </div>
              </DropZone>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {attachments.map((a) => (
                  <div key={a.id} className="relative group">
                    <button
                      type="button"
                      onClick={() =>
                        isImage(a.mimeType) || isVideo(a.mimeType)
                          ? setLightbox({
                              src: a.downloadUrl,
                              type: isImage(a.mimeType) ? "image" : "video",
                            })
                          : window.open(a.downloadUrl, "_blank")
                      }
                      className="block border border-border-input rounded-lg overflow-hidden hover:border-primary-300 transition-colors cursor-pointer"
                    >
                      {isImage(a.mimeType) ? (
                        <img
                          src={a.downloadUrl}
                          alt={a.originalName}
                          className="w-32 h-32 object-cover"
                        />
                      ) : isVideo(a.mimeType) ? (
                        <video
                          src={a.downloadUrl}
                          className="w-32 h-32 object-cover"
                        />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center bg-surface-hover">
                          <span className="text-exs text-muted text-center px-2 break-all">
                            {a.originalName}
                          </span>
                        </div>
                      )}
                    </button>
                    {!isReadonly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAttachment(a.id);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          </>
          ) : (
          <>
            {workspaceSlug && ticketId && (
              <TicketActivityFeed
                workspaceSlug={workspaceSlug}
                ticketId={ticketId}
                members={members}
                refreshKey={activityKey}
              />
            )}
          </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {isEditing && draft ? (
            <>
              <Card className="p-4">
                {canChangeStatus ? (
                  <FormInput label={t("ticketDetail.status")} className={clsx("!mb-0")}>
                    <Select
                      options={[...STATUSES]}
                      label={(s) => tEnum("status", s)}
                      value={(s) => s === draft.status}
                      onChange={handleDraftStatusChange}
                    />
                  </FormInput>
                ) : (
                  <>
                    <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.status")}</p>
                    <StatusBadge label={tEnum("status", draft.status)} color={STATUS_COLORS[draft.status] || "gray"} />
                  </>
                )}
              </Card>

              <Card className="p-4">
                {canEditFields ? (
                  <FormInput label={t("ticketDetail.priority")} className={clsx("!mb-0")}>
                    <Select
                      options={[...PRIORITIES]}
                      label={(p) => tEnum("priority", p)}
                      value={(p) => p === draft.priority}
                      onChange={(p) => setDraft((d) => d ? { ...d, priority: p } : d)}
                    />
                  </FormInput>
                ) : (
                  <>
                    <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.priority")}</p>
                    <StatusBadge label={tEnum("priority", draft.priority)} color={PRIORITY_COLORS[draft.priority] || "gray"} />
                  </>
                )}
              </Card>

              {wsProjects.length > 0 && (
                <Card className="p-4">
                  {canEditFields ? (
                    <FormInput label={t("ticketDetail.project")} className={clsx("!mb-0")}>
                      <Select
                        options={[{ id: "", name: "—", description: null } as Project, ...wsProjects]}
                        label={(p) => p.name}
                        value={(p) => p.id === (draft.projectId ?? "")}
                        onChange={(p) => {
                          const newProjectId = p.id || null;
                          setDraft((d) => d ? { ...d, projectId: newProjectId } : d);
                          if (newProjectId && workspaceSlug) {
                            listCategories(workspaceSlug, newProjectId).then((cats) => {
                              const inProject = cats.filter((c) => c.inProject);
                              setEditCategories(inProject.length > 0 ? inProject : wsCategories);
                              if (draft && inProject.length > 0 && !inProject.some((c) => c.id === draft.categoryId)) {
                                const def = inProject[0];
                                if (def) setDraft((d) => d ? { ...d, categoryId: def.id } : d);
                              }
                            });
                          } else {
                            setEditCategories(wsCategories);
                          }
                        }}
                      />
                    </FormInput>
                  ) : (
                    <>
                      <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.project")}</p>
                      {draft.projectId ? (
                        <StatusBadge label={wsProjects.find((p) => p.id === draft.projectId)?.name ?? "—"} color="primary" size="xs" />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </>
                  )}
                </Card>
              )}

              <Card className="p-4">
                {canEditFields ? (
                  <FormInput label={t("ticketDetail.category")} className={clsx("!mb-0")}>
                    <Select
                      options={editCategories.length > 0 ? editCategories : wsCategories}
                      label={(c) => c.name}
                      value={(c) => c.id === draft.categoryId}
                      onChange={(c) => setDraft((d) => d ? { ...d, categoryId: c.id } : d)}
                    />
                  </FormInput>
                ) : (
                  <>
                    <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.category")}</p>
                    {(() => { const cat = wsCategories.find((c) => c.id === draft.categoryId); return <StatusBadge label={cat?.name ?? "—"} color={(cat?.color as any) || "primary"} size="xs" />; })()}
                  </>
                )}
              </Card>

              {departments.length > 0 && (
                <Card className="p-4">
                  {canAssign ? (
                    <FormInput label={t("ticketDetail.department")} className="!mb-0">
                      <Select
                        options={[{ id: "", name: "—", description: "" } as Department, ...departments]}
                        label={(d) => d.name}
                        value={(d) => d.id === (draft.departmentId ?? "")}
                        onChange={(d) => setDraft((prev) => prev ? { ...prev, departmentId: d.id || null } : prev)}
                      />
                    </FormInput>
                  ) : (
                    <>
                      <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.department")}</p>
                      {draft.departmentId ? (
                        <StatusBadge label={departments.find((d) => d.id === draft.departmentId)?.name ?? "—"} color="primary" size="xs" />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </>
                  )}
                </Card>
              )}

              {organizations.length > 0 && (
                <Card className="p-4">
                  {canAssign ? (
                    <FormInput label={t("ticketDetail.organization")} className="!mb-0">
                      <Select
                        options={[{ id: "", name: "—", description: null, notes: null, domains: [], logo: null } as Organization, ...organizations]}
                        label={(o) => o.name}
                        value={(o) => o.id === (draft.organizationId ?? "")}
                        onChange={(o) => setDraft((prev) => prev ? { ...prev, organizationId: o.id || null } : prev)}
                      />
                    </FormInput>
                  ) : (
                    <>
                      <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.organization")}</p>
                      {draft.organizationId ? (
                        <StatusBadge label={organizations.find((o) => o.id === draft.organizationId)?.name ?? "—"} color="primary" size="xs" />
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </>
                  )}
                </Card>
              )}

              {canAssign ? (
                <Card className="p-4">
                  <FormInput label={t("ticketDetail.assignee")} className="!mb-0">
                    <Select
                      options={assignableMembers}
                      label={(m) => `${m.firstName} ${m.lastName}`}
                      value={(m) => m.userId === draft.assigneeId}
                      onChange={(m) => setDraft((d) => d ? { ...d, assigneeId: m.userId } : d)}
                      placeholder={t("ticketDetail.selectAssignee")}
                    />
                  </FormInput>
                </Card>
              ) : ticket.assigneeId ? (
                <Card className="p-4">
                  <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.assignee")}</p>
                  <p className="text-sm text-body font-body-medium">{getMemberName(ticket.assigneeId)}</p>
                  {canTransfer && !pendingTransfer && (
                    <Button size="xs" color="light" className="mt-2 w-full" onClick={() => { setTransferTarget(null); setShowTransferModal(true); }}>
                      {t("tickets.transfer")}
                    </Button>
                  )}
                </Card>
              ) : null}

              {pendingTransfer && workspaceSlug && ticketId && (
                <Card className="p-4 border-amber-300 dark:border-amber-700">
                  <p className="text-xs text-subtle font-body-medium mb-1">{t("tickets.pendingTransfer")}</p>
                  <p className="text-xs text-muted mb-3">
                    {pendingTransfer.targetUserId === user?.id
                      ? t("tickets.pendingTransferFrom").replace("{name}", pendingTransfer.requesterName)
                      : t("tickets.pendingTransferTo").replace("{name}", pendingTransfer.targetName)}
                  </p>
                  <div className="flex gap-2">
                    {pendingTransfer.targetUserId === user?.id ? (
                      <>
                        <Button size="xs" color="primary" onClick={async () => {
                          try {
                            await acceptTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                            toast.success(t("tickets.transferAccepted"));
                            fetchTicket(true);
                          } catch { toast.error("Failed"); }
                        }}>{t("tickets.accept")}</Button>
                        <Button size="xs" color="light" onClick={async () => {
                          try {
                            await rejectTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                            toast.success(t("tickets.transferRejected"));
                            fetchTicket(true);
                          } catch { toast.error("Failed"); }
                        }}>{t("tickets.reject")}</Button>
                      </>
                    ) : pendingTransfer.requesterId === user?.id ? (
                      <Button size="xs" color="light" onClick={async () => {
                        try {
                          await cancelTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                          toast.success(t("tickets.transferCancelled"));
                          fetchTicket(true);
                        } catch { toast.error("Failed"); }
                      }}>{t("tickets.cancelTransfer")}</Button>
                    ) : null}
                  </div>
                </Card>
              )}

              <Card className="p-4">
                <FormInput label={t("ticketDetail.tags")} className="!mb-0">
                  <TagSelector
                    tags={workspaceTags}
                    selectedIds={draft.tagIds}
                    onChange={(ids) => setDraft((d) => d ? { ...d, tagIds: ids } : d)}
                    disabled={!canEditTags}
                  />
                </FormInput>
              </Card>

              {customFieldDefs.length > 0 && (
                <Card className="p-4">
                  {canEditCustomFields ? (
                    <CustomFieldsForm
                      definitions={customFieldDefs}
                      values={draft.customFields}
                      onChange={(values) => setDraft((d) => d ? { ...d, customFields: values } : d)}
                    />
                  ) : (
                    customFieldDefs.map((def) => {
                      const val = draft.customFields[def.id];
                      if (val === undefined || val === null || val === "") return null;
                      return (
                        <div key={def.id} className="flex justify-between text-xs mb-1.5 last:mb-0">
                          <span className="text-muted">{def.name}</span>
                          <span className="text-body font-body-medium text-right max-w-[60%]">
                            {Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </Card>
              )}
            </>
          ) : (
            <>
              <Card className="p-4">
                <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.status")}</p>
                <StatusBadge label={tEnum("status", ticket.status)} color={STATUS_COLORS[ticket.status] || "gray"} />
              </Card>

              <Card className="p-4">
                <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.priority")}</p>
                <StatusBadge label={tEnum("priority", ticket.priority)} color={PRIORITY_COLORS[ticket.priority] || "gray"} />
              </Card>

              {ticket.projectId && (() => {
                const proj = wsProjects.find((p) => p.id === ticket.projectId);
                return proj ? (
                  <Card className="p-4">
                    <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.project")}</p>
                    <StatusBadge label={proj.name} color="primary" size="xs" />
                  </Card>
                ) : null;
              })()}

              <Card className="p-4">
                <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.category")}</p>
                {(() => { const cat = wsCategories.find((c) => c.id === ticket.categoryId); return <StatusBadge label={cat?.name ?? "—"} color={(cat?.color as any) || "primary"} size="xs" />; })()}
              </Card>

              <Card className="p-4">
                <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.source")}</p>
                <StatusBadge label={tEnum("source", ticket.source)} color="gray" size="xs" />
              </Card>

              {ticket.originDate && (
                <Card className="p-4">
                  <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.originalDate")}</p>
                  <p className="text-sm text-body">{formatDate(ticket.originDate)}</p>
                </Card>
              )}

              {ticket.departmentId && (() => {
                const dept = departments.find((d) => d.id === ticket.departmentId);
                return dept ? (
                  <Card className="p-4">
                    <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.department")}</p>
                    <StatusBadge label={dept.name} color="primary" size="xs" />
                  </Card>
                ) : null;
              })()}

              {ticket.assigneeId && (
                <Card className="p-4">
                  <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.assignee")}</p>
                  <p className="text-sm text-body font-body-medium">{getMemberName(ticket.assigneeId)}</p>
                  {canTransfer && !pendingTransfer && (
                    <Button size="xs" color="light" className="mt-2 w-full" onClick={() => { setTransferTarget(null); setShowTransferModal(true); }}>
                      {t("tickets.transfer")}
                    </Button>
                  )}
                </Card>
              )}

              {pendingTransfer && workspaceSlug && ticketId && (
                <Card className="p-4 border-amber-300 dark:border-amber-700">
                  <p className="text-xs text-subtle font-body-medium mb-1">{t("tickets.pendingTransfer")}</p>
                  <p className="text-xs text-muted mb-3">
                    {pendingTransfer.targetUserId === user?.id
                      ? t("tickets.pendingTransferFrom").replace("{name}", pendingTransfer.requesterName)
                      : t("tickets.pendingTransferTo").replace("{name}", pendingTransfer.targetName)}
                  </p>
                  <div className="flex gap-2">
                    {pendingTransfer.targetUserId === user?.id ? (
                      <>
                        <Button size="xs" color="primary" onClick={async () => {
                          try {
                            await acceptTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                            toast.success(t("tickets.transferAccepted"));
                            fetchTicket(true);
                          } catch { toast.error("Failed"); }
                        }}>{t("tickets.accept")}</Button>
                        <Button size="xs" color="light" onClick={async () => {
                          try {
                            await rejectTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                            toast.success(t("tickets.transferRejected"));
                            fetchTicket(true);
                          } catch { toast.error("Failed"); }
                        }}>{t("tickets.reject")}</Button>
                      </>
                    ) : pendingTransfer.requesterId === user?.id ? (
                      <Button size="xs" color="light" onClick={async () => {
                        try {
                          await cancelTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                          toast.success(t("tickets.transferCancelled"));
                          fetchTicket(true);
                        } catch { toast.error("Failed"); }
                      }}>{t("tickets.cancelTransfer")}</Button>
                    ) : null}
                  </div>
                </Card>
              )}

              <Card className="p-4">
                <FormInput label={t("ticketDetail.tags")} className="!mb-0">
                  <TagSelector
                    tags={workspaceTags}
                    selectedIds={ticket.tagIds}
                    onChange={() => {}}
                    disabled
                  />
                </FormInput>
              </Card>

              {customFieldDefs.length > 0 && (
                <Card className="p-4">
                  {customFieldDefs.map((def) => {
                    const val = (ticket.customFields ?? {})[def.id];
                    if (val === undefined || val === null || val === "") return null;
                    return (
                      <div key={def.id} className="flex justify-between text-xs mb-1.5 last:mb-0">
                        <span className="text-muted">{def.name}</span>
                        <span className="text-body font-body-medium text-right max-w-[60%]">
                          {Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              )}
            </>
          )}

          <Card className="p-4">
            <p className="text-xs text-subtle font-body-medium mb-2">
              {t("ticketDetail.followers")} ({participants.length})
            </p>
            {participants.length > 0 ? (
              <div className="space-y-1.5">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-exs font-body-bold text-primary">
                          {p.firstName[0]}{p.lastName[0]}
                        </span>
                      </div>
                      <span className="text-xs text-body">{p.firstName} {p.lastName}</span>
                    </div>
                    {canAssign && (
                      <button
                        onClick={async () => {
                          if (!workspaceSlug || !ticketId) return;
                          await removeParticipant(workspaceSlug, ticketId, p.userId);
                          fetchParticipants();
                        }}
                        className="text-exs text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {t("ticketDetail.removeFollower")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-exs text-muted">{t("ticketDetail.followerHint")}</p>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-xs text-subtle font-body-medium mb-2">
              {t("ticketDetail.details")}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-muted shrink-0">{t("ticketDetail.reportedBy")}</span>
                <MemberLink userId={ticket.reporterId} members={members} getMemberName={getMemberName} navigate={navigate} workspaceSlug={workspaceSlug} />
              </div>
              {ticket.registeredById && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted shrink-0">{t("ticketDetail.registeredBy")}</span>
                  <MemberLink userId={ticket.registeredById} members={members} getMemberName={getMemberName} navigate={navigate} workspaceSlug={workspaceSlug} />
                </div>
              )}
              {ticket.assigneeId && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("ticketDetail.assignee")}</span>
                  <span className="text-body font-body-medium">
                    {getMemberName(ticket.assigneeId)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-muted shrink-0">{t("ticketDetail.firstResponse")}</span>
                <span className="text-body font-body-medium text-right">
                  {ticket.firstResponseAt && ticket.createdAt
                    ? formatResponseTime(ticket.createdAt, ticket.firstResponseAt)
                    : isTerminal
                      ? "—"
                      : t("ticketDetail.awaitingResponse")}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("ticketDetail.resolved")}</span>
                  <span className="text-body font-body-medium">
                    {formatDate(ticket.resolvedAt)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {slaPolicy && (
            <SlaStatusCard ticket={ticket} slaPolicy={slaPolicy} t={t} isTerminal={isTerminal} />
          )}

          {slaLocked && (
            <Card>
              <div className="flex items-center gap-3 p-4">
                <svg className="w-5 h-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div>
                  <p className="text-xs font-body-semibold text-heading">{t("ticketDetail.slaLocked")}</p>
                  <a href="/dashboard/settings/billing" className="text-xs text-primary hover:underline">
                    {t("planLimit.upgradeToUnlock")}
                  </a>
                </div>
              </div>
            </Card>
          )}

          {canDelete && (
            <Button
              size="xs"
              color="danger"
              full
              onClick={handleDelete}
            >
              {t("ticketDetail.deleteTicket")}
            </Button>
          )}
        </div>
      </div>

      {historyModal && (
        <VersionHistoryModal
          title={t("editHistory.title")}
          items={historyItems}
          onClose={() => { setHistoryModal(null); setHistoryItems(null); }}
        />
      )}
    </div>
  );
}
