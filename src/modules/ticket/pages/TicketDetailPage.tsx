import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import clsx from "clsx";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Textarea from "@modules/app/modules/ui/components/Textarea/Textarea";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import CommentInput from "@modules/comment/components/CommentInput";
import { CannedResponse, listCannedResponses } from "@modules/canned-response/services/canned-response.service";
import { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";
import { listCustomFields } from "@modules/custom-field/services/custom-field.service";
import CustomFieldsForm from "@modules/custom-field/components/CustomFieldsForm";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
import { handlePlanLimitError } from "@modules/billing/domain/plan-limit-error";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import {
  TicketDetail,
  getTicket,
  updateTicket,
  changeTicketStatus,
  assignTicket,
  deleteTicket,
} from "../services/ticket.service";
import {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "../domain/ticket-enums";
import {
  CommentItem,
  listComments,
  createComment,
} from "@modules/comment/services/comment.service";
import {
  AttachmentDetail,
  uploadToTicket,
  listTicketAttachments,
  deleteAttachment,
} from "@modules/attachment/services/attachment.service";
import {
  WorkspaceMember,
  listMembers,
} from "@modules/workspace/services/workspace.service";
import { Tag, listTags } from "@modules/tag/services/tag.service";
import TagSelector from "@modules/tag/components/TagSelector";
import useFileDrop from "@modules/shared/hooks/useFileDrop";
import DropOverlay from "@modules/app/modules/ui/components/DropOverlay/DropOverlay";
import useTranslation from "@modules/app/i18n/useTranslation";
import TicketActivityFeed from "@modules/audit-log/components/TicketActivityFeed";

interface Props {
  workspaceSlugProp?: string;
  ticketIdProp?: string;
  onClose?: () => void;
  initialMode?: "view" | "edit";
}

export default function TicketDetailPage({ workspaceSlugProp, ticketIdProp, onClose, initialMode = "view" }: Props = {}) {
  const params = useParams();
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const ticketId = ticketIdProp || params.ticketId;
  const { user } = useUser();
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDetail[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [showCloseReasonModal, setShowCloseReasonModal] = useState(false);
  const [activityKey, setActivityKey] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  interface Draft {
    name: string;
    description: string;
    priority: string;
    category: string;
    status: string;
    assigneeId: string | null;
    tagIds: string[];
    customFields: Record<string, unknown>;
    discardReason?: string;
  }
  const [draft, setDraft] = useState<Draft | null>(null);

  const enterEdit = () => {
    if (!ticket) return;
    setDraft({
      name: ticket.name,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      status: ticket.status,
      assigneeId: ticket.assigneeId,
      tagIds: [...ticket.tagIds],
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
    if (draft.category !== ticket.category) changes.push({ field: t("ticketDetail.category"), from: tEnum("category", ticket.category), to: tEnum("category", draft.category) });
    if (draft.assigneeId !== ticket.assigneeId) changes.push({ field: t("ticketDetail.assignee"), from: ticket.assigneeId ? getMemberName(ticket.assigneeId) : "—", to: draft.assigneeId ? getMemberName(draft.assigneeId) : "—" });
    if (JSON.stringify(draft.tagIds) !== JSON.stringify(ticket.tagIds)) changes.push({ field: t("ticketDetail.tags"), from: ticket.tagIds.map((id) => workspaceTags.find((t) => t.id === id)?.name ?? id).join(", ") || "—", to: draft.tagIds.map((id) => workspaceTags.find((t) => t.id === id)?.name ?? id).join(", ") || "—" });
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

  useEffect(() => {
    fetchTicket();
    fetchComments();
    fetchAttachments();
    fetchMembers();
    if (workspaceSlug) listTags(workspaceSlug).then(setWorkspaceTags);
    if (workspaceSlug) listCustomFields(workspaceSlug).then(setCustomFieldDefs).catch(() => {});
  }, [workspaceSlug, ticketId]);

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

  const { dragging } = useFileDrop({
    onFiles: handleDroppedFiles,
    accept: ["image/*", "video/*"],
  });

  const { can } = usePermissions(workspaceSlug);

  useEffect(() => {
    if (workspaceSlug && can(P.CANNED_RESPONSE_VIEW)) {
      listCannedResponses(workspaceSlug).then(setCannedResponses).catch(() => {});
    }
  }, [workspaceSlug, can(P.CANNED_RESPONSE_VIEW)]);

  const isCreator = ticket?.creatorId === user?.id;
  const isTerminal = ticket?.status === "discarded" || ticket?.status === "resolved";
  const isEditing = mode === "edit";

  const canChangeStatus = isEditing && (isTerminal ? can(P.TICKET_CHANGE_STATUS_DISCARDED) : can(P.TICKET_CHANGE_STATUS));
  const canEditFields = isEditing && (isTerminal ? can(P.TICKET_EDIT_DISCARDED) : can(P.TICKET_EDIT_DESCRIPTION));
  const canEditName = isEditing && can(P.TICKET_EDIT_NAME);
  const canAssign = isEditing && can(P.TICKET_ASSIGN);
  const canDelete = isEditing && can(P.TICKET_DELETE);
  const canEditTags = isEditing && (isTerminal ? can(P.TICKET_EDIT_DISCARDED) : can(P.TICKET_EDIT_TAGS));
  const canEditCustomFields = isEditing && can(P.TICKET_EDIT_DESCRIPTION);
  const canSwitchToEdit = mode === "view" && (
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
      const updates: Partial<{ name: string; description: string; priority: string; category: string; tagIds: string[]; customFields: Record<string, unknown> }> = {};
      if (draft.name !== ticket.name) updates.name = draft.name;
      if (draft.description !== ticket.description) updates.description = draft.description;
      if (draft.priority !== ticket.priority) updates.priority = draft.priority;
      if (draft.category !== ticket.category) updates.category = draft.category;
      if (JSON.stringify(draft.tagIds) !== JSON.stringify(ticket.tagIds)) updates.tagIds = draft.tagIds;
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
      setActivityKey((k) => k + 1);
    } catch (err) {
      handlePlanLimitError(err, "Failed to add comment");
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
      <DropOverlay visible={dragging} />

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
          <h2 className="text-lg font-body-bold text-heading">{ticket.name}</h2>
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
            <StatusBadge label={tEnum("category", ticket.category)} color="primary" size="xs" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <p className="text-xs font-body-medium text-subtle uppercase mb-2">
              {t("ticketDetail.description")}
            </p>
            {isEditing && draft && canEditFields ? (
              <Textarea
                value={draft.description}
                onChange={(v) => setDraft((d) => d ? { ...d, description: v } : d)}
                height={120}
              />
            ) : (
              <p className="text-sm text-body whitespace-pre-wrap">
                {ticket.description}
              </p>
            )}
          </Card>

          {/* Attachments */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-body-medium text-subtle uppercase">
                {t("ticketDetail.attachments")} ({attachments.length})
              </p>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttachment(a.id);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
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
                  <p className="text-exs text-subtle mb-1">
                    {getMemberName(c.authorId)}
                  </p>
                  <p
                    className="text-sm text-body"
                    dangerouslySetInnerHTML={{
                      __html: c.content.replace(
                        /@\[([^\]]+)\]\([^)]+\)/g,
                        '<span class="text-primary font-body-semibold">@$1</span>',
                      ),
                    }}
                  />
                </Card>
              ))}
            </div>

            <CommentInput
              members={members}
              loading={sendingComment}
              onSubmit={handleAddComment}
              cannedResponses={cannedResponses}
            />
          </div>

          {/* Activity Feed */}
          {workspaceSlug && ticketId && (
            <TicketActivityFeed
              workspaceSlug={workspaceSlug}
              ticketId={ticketId}
              members={members}
              refreshKey={activityKey}
            />
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

              <Card className="p-4">
                {canEditFields ? (
                  <FormInput label={t("ticketDetail.category")} className={clsx("!mb-0")}>
                    <Select
                      options={[...CATEGORIES]}
                      label={(c) => tEnum("category", c)}
                      value={(c) => c === draft.category}
                      onChange={(c) => setDraft((d) => d ? { ...d, category: c } : d)}
                    />
                  </FormInput>
                ) : (
                  <>
                    <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.category")}</p>
                    <StatusBadge label={tEnum("category", draft.category)} color="primary" size="xs" />
                  </>
                )}
              </Card>

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
              ) : draft.assigneeId ? (
                <Card className="p-4">
                  <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.assignee")}</p>
                  <p className="text-sm text-body font-body-medium">{getMemberName(draft.assigneeId)}</p>
                </Card>
              ) : null}

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

              <Card className="p-4">
                <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.category")}</p>
                <StatusBadge label={tEnum("category", ticket.category)} color="primary" size="xs" />
              </Card>

              {ticket.assigneeId && (
                <Card className="p-4">
                  <p className="text-xs text-subtle font-body-medium mb-1">{t("ticketDetail.assignee")}</p>
                  <p className="text-sm text-body font-body-medium">{getMemberName(ticket.assigneeId)}</p>
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
              {t("ticketDetail.details")}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">{t("ticketDetail.creator")}</span>
                <span className="text-body font-body-medium">
                  {getMemberName(ticket.creatorId)}
                </span>
              </div>
              {ticket.assigneeId && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("ticketDetail.assignee")}</span>
                  <span className="text-body font-body-medium">
                    {getMemberName(ticket.assigneeId)}
                  </span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("ticketDetail.resolved")}</span>
                  <span className="text-body font-body-medium">
                    {new Date(ticket.resolvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

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
    </div>
  );
}
