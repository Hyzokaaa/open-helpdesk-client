import { useCallback, useEffect, useState, useRef } from "react";
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
} from "@modules/comment/services/comment.service";
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
import MemberLink from "../components/MemberLink";
import SlaStatusCard from "../components/SlaStatusCard";
import TicketTransferModal from "../components/TicketTransferModal";
import TicketReviewChangesModal from "../components/TicketReviewChangesModal";
import TicketDiscardReasonModal from "../components/TicketDiscardReasonModal";
import { formatResponseTime } from "../domain/format-response-time";
import { getTicketChanges } from "../domain/get-ticket-changes";
import useVersionHistory from "../hooks/useVersionHistory";
import useTicketDetail from "../hooks/useTicketDetail";
import useTicketEdit from "../hooks/useTicketEdit";

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

  const {
    ticket, setTicket,
    pendingTransfer,
    comments, setComments,
    attachments,
    participants,
    members,
    workspaceTags,
    departments,
    organizations,
    cannedResponses,
    customFieldDefs,
    wsCategories,
    wsProjects,
    slaPolicy,
    slaLocked,
    loading,
    activityKey, setActivityKey,
    can,
    fetchTicket,
    fetchComments,
    fetchAttachments,
    fetchParticipants,
    handleDroppedFiles,
    getMemberName,
    assignableMembers,
  } = useTicketDetail({ workspaceSlug, ticketId, isPlanLimitError, t });

  const {
    mode, draft, setDraft,
    editCategories, setEditCategories,
    saving, isEditing,
    showChangesModal, setShowChangesModal,
    showDiscardModal, closeDiscardModal,
    showCloseReasonModal, setShowCloseReasonModal,
    enterEdit, cancelEdit, confirmDiscard, requestSave,
    handleSave, handleDraftStatusChange, getChanges,
  } = useTicketEdit({
    workspaceSlug, ticketId, ticket,
    wsCategories, wsProjects, workspaceTags, departments, organizations, customFieldDefs,
    getMemberName, fetchTicket,
    getDescriptionHtml: () => descriptionEditorRef.current?.getHTML() ?? null,
    onDirtyChange, onClose, navigate, handlePlanLimitError, t, tEnum, initialMode,
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [detailTab, setDetailTab] = useState<"details" | "activity">("details");
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const isCreator = ticket?.reporterId === user?.id;
  const isTerminal = ticket?.status === "discarded" || ticket?.status === "resolved";
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

  const { historyModal, historyItems, openHistory, closeHistory } = useVersionHistory(workspaceSlug, ticketId, getMemberName);

  const handleDelete = () => {
    setConfirmAction({
      title: t("ticketDetail.deleteTitle"),
      message: t("ticketDetail.deleteMessage"),
      onConfirm: async () => {
        if (!workspaceSlug || !ticketId) return;
        try {
          await deleteTicket(workspaceSlug, ticketId);
          toast.success(t("ticketDetail.ticketDeleted"));
          if (onClose) onClose();
          else navigate(`/dashboard/workspaces/${workspaceSlug}/tickets`);
        } catch {
          toast.error(t("ticketDetail.deleteTicketError"));
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
      handlePlanLimitError(err, t("ticketDetail.commentError"));
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
      handlePlanLimitError(err, t("ticketDetail.resolveError"));
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
          toast.success(t("ticketDetail.attachmentDeleted"));
        } catch {
          toast.error(t("ticketDetail.attachmentDeleteError"));
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
      toast.success(t("ticketDetail.fileUploaded"));
      fetchAttachments();
    } catch {
      toast.error(t("ticketDetail.uploadFailed"));
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
          onCancel={closeDiscardModal}
        />
      )}

      {showTransferModal && workspaceSlug && ticketId && (
        <TicketTransferModal
          assignableMembers={assignableMembers}
          currentUserId={user?.id ?? ""}
          t={t}
          onClose={() => setShowTransferModal(false)}
          onTransfer={async (targetUserId) => {
            try {
              await transferTicket(workspaceSlug, ticketId, targetUserId);
              toast.success(t("tickets.transferred"));
              fetchTicket(true);
            } catch { toast.error(t("ticketDetail.actionError")); }
            setShowTransferModal(false);
          }}
        />
      )}

      {showChangesModal && (
        <TicketReviewChangesModal
          changes={getChanges()}
          saving={saving}
          t={t}
          onCancel={() => setShowChangesModal(false)}
          onConfirm={() => { setShowChangesModal(false); handleSave(); }}
        />
      )}

      {showCloseReasonModal && (
        <TicketDiscardReasonModal
          t={t}
          tEnum={tEnum}
          onCancel={() => setShowCloseReasonModal(false)}
          onSelectReason={(reason) => {
            setShowCloseReasonModal(false);
            setDraft((d) => d ? { ...d, status: "discarded", discardReason: reason } : d);
          }}
        />
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
                    <Button size="xs" color="light" className="mt-2 w-full" onClick={() => { setShowTransferModal(true); }}>
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
                          } catch { toast.error(t("ticketDetail.actionError")); }
                        }}>{t("tickets.accept")}</Button>
                        <Button size="xs" color="light" onClick={async () => {
                          try {
                            await rejectTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                            toast.success(t("tickets.transferRejected"));
                            fetchTicket(true);
                          } catch { toast.error(t("ticketDetail.actionError")); }
                        }}>{t("tickets.reject")}</Button>
                      </>
                    ) : pendingTransfer.requesterId === user?.id ? (
                      <Button size="xs" color="light" onClick={async () => {
                        try {
                          await cancelTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                          toast.success(t("tickets.transferCancelled"));
                          fetchTicket(true);
                        } catch { toast.error(t("ticketDetail.actionError")); }
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
                    <Button size="xs" color="light" className="mt-2 w-full" onClick={() => { setShowTransferModal(true); }}>
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
                          } catch { toast.error(t("ticketDetail.actionError")); }
                        }}>{t("tickets.accept")}</Button>
                        <Button size="xs" color="light" onClick={async () => {
                          try {
                            await rejectTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                            toast.success(t("tickets.transferRejected"));
                            fetchTicket(true);
                          } catch { toast.error(t("ticketDetail.actionError")); }
                        }}>{t("tickets.reject")}</Button>
                      </>
                    ) : pendingTransfer.requesterId === user?.id ? (
                      <Button size="xs" color="light" onClick={async () => {
                        try {
                          await cancelTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                          toast.success(t("tickets.transferCancelled"));
                          fetchTicket(true);
                        } catch { toast.error(t("ticketDetail.actionError")); }
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
          onClose={closeHistory}
        />
      )}
    </div>
  );
}
