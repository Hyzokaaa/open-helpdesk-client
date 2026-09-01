import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import MiniEditor, { MiniEditorRef } from "@modules/app/modules/ui/components/MiniEditor/MiniEditor";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import CommentInput from "@modules/comment/components/CommentInput";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
import useExtensions from "@modules/app/extensions/useExtensions";
import useUser from "@modules/user/hooks/useUser";
import { P } from "@modules/workspace/domain/permissions";
import {
  changeTicketStatus,
  transferTicket,
  deleteTicket,
} from "../services/ticket.service";
import {
  createComment,
  editComment,
} from "@modules/comment/services/comment.service";
import VersionHistoryModal from "@modules/shared/components/VersionHistoryModal";
import {
  uploadToTicket,
  deleteAttachment,
} from "@modules/attachment/services/attachment.service";
import DropZone from "@modules/app/modules/ui/components/DropZone/DropZone";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import { improveText, translateText, saveAiCache, clearAiCache } from "@modules/ai/services/ai.service";
import TicketActivityFeed from "@modules/audit-log/components/TicketActivityFeed";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import TicketTransferModal from "../components/TicketTransferModal";
import TicketReviewChangesModal from "../components/TicketReviewChangesModal";
import TicketDiscardReasonModal from "../components/TicketDiscardReasonModal";
import TicketDetailHeader from "../components/TicketDetailHeader";
import TicketDetailSidebar from "../components/TicketDetailSidebar";
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

      <TicketDetailHeader
        ticket={ticket}
        draft={draft}
        setDraft={setDraft}
        isEditing={isEditing}
        canSwitchToEdit={canSwitchToEdit}
        canEditName={canEditName}
        canEditFields={canEditFields}
        wsCategories={wsCategories}
        saving={saving}
        enterEdit={enterEdit}
        cancelEdit={cancelEdit}
        requestSave={requestSave}
        t={t}
        tEnum={tEnum}
      />

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
                ariaLabel={t("ticketDetail.description")}
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
                        ariaLabel={t("ticketDetail.editComment")}
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

        <TicketDetailSidebar
          ticket={ticket}
          draft={draft}
          setDraft={setDraft}
          isEditing={isEditing}
          canChangeStatus={canChangeStatus}
          canEditFields={canEditFields}
          canAssign={canAssign}
          canTransfer={canTransfer}
          canDelete={canDelete}
          canEditTags={canEditTags}
          canEditCustomFields={canEditCustomFields}
          isTerminal={isTerminal}
          pendingTransfer={pendingTransfer}
          participants={participants}
          members={members}
          wsCategories={wsCategories}
          wsProjects={wsProjects}
          editCategories={editCategories}
          setEditCategories={setEditCategories}
          workspaceTags={workspaceTags}
          departments={departments}
          organizations={organizations}
          assignableMembers={assignableMembers}
          customFieldDefs={customFieldDefs}
          slaPolicy={slaPolicy}
          slaLocked={slaLocked}
          workspaceSlug={workspaceSlug}
          ticketId={ticketId}
          userId={user?.id}
          getMemberName={getMemberName}
          fetchTicket={fetchTicket}
          fetchParticipants={fetchParticipants}
          handleDraftStatusChange={handleDraftStatusChange}
          handleDelete={handleDelete}
          setShowTransferModal={setShowTransferModal}
          navigate={navigate}
          formatDate={formatDate}
          t={t}
          tEnum={tEnum}
        />
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
