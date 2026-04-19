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
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
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

interface Props {
  workspaceSlugProp?: string;
  ticketIdProp?: string;
  onClose?: () => void;
}

export default function TicketDetailPage({ workspaceSlugProp, ticketIdProp, onClose }: Props = {}) {
  const params = useParams();
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const ticketId = ticketIdProp || params.ticketId;
  const { user } = useUser();
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDetail[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const [editName, setEditName] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchTicket = () => {
    if (!workspaceSlug || !ticketId) return;
    getTicket(workspaceSlug, ticketId)
      .then((t) => {
        setTicket(t);
        setSelectedAssigneeId(t.assigneeId);
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
  const isCreator = ticket?.creatorId === user?.id;
  const isClosed = ticket?.status === "closed";

  const canChangeStatus = isClosed ? can(P.TICKET_CHANGE_STATUS_CLOSED) : can(P.TICKET_CHANGE_STATUS);
  const canEditFields = isClosed ? can(P.TICKET_EDIT_CLOSED) : (can(P.TICKET_EDIT_DESCRIPTION) || isCreator);
  const canEditName = can(P.TICKET_EDIT_NAME);
  const canAssign = can(P.TICKET_ASSIGN);
  const canDelete = can(P.TICKET_DELETE);
  const canEditTags = isClosed ? can(P.TICKET_EDIT_CLOSED) : (can(P.TICKET_EDIT_TAGS) || isCreator);

  const assignableMembers = members.filter(
    (m) => m.role === "admin" || m.role === "agent",
  );

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.userId === userId);
    return m ? `${m.firstName} ${m.lastName}` : userId;
  };

  const handleSaveName = async () => {
    if (!workspaceSlug || !ticketId || !editName.trim()) return;
    try {
      await updateTicket(workspaceSlug, ticketId, { name: editName });
      fetchTicket();
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleSaveDescription = async () => {
    if (!workspaceSlug || !ticketId) return;
    try {
      await updateTicket(workspaceSlug, ticketId, { description: editDescription });
      fetchTicket();
      setEditingDescription(false);
      toast.success("Description updated");
    } catch {
      toast.error("Failed to update description");
    }
  };

  const handlePriorityChange = async (priority: string) => {
    if (!workspaceSlug || !ticketId) return;
    try {
      await updateTicket(workspaceSlug, ticketId, { priority });
      fetchTicket();
      toast.success("Priority updated");
    } catch {
      toast.error("Failed to update priority");
    }
  };

  const handleCategoryChange = async (category: string) => {
    if (!workspaceSlug || !ticketId) return;
    try {
      await updateTicket(workspaceSlug, ticketId, { category });
      fetchTicket();
      toast.success("Category updated");
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!workspaceSlug || !ticketId) return;
    try {
      await changeTicketStatus(workspaceSlug, ticketId, status);
      fetchTicket();
      toast.success("Status updated");
    } catch {
      toast.error("Cannot transition to this status");
    }
  };

  const handleTagsChange = async (tagIds: string[]) => {
    if (!workspaceSlug || !ticketId) return;
    try {
      await updateTicket(workspaceSlug, ticketId, { tagIds });
      fetchTicket();
    } catch {
      toast.error("Failed to update tags");
    }
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

  const handleAssign = async (member: WorkspaceMember) => {
    if (!workspaceSlug || !ticketId) return;
    try {
      await assignTicket(workspaceSlug, ticketId, member.userId);
      setSelectedAssigneeId(member.userId);
      fetchTicket();
      toast.success("Assignee updated");
    } catch {
      toast.error("Failed to assign");
    }
  };

  const handleAddComment = async (content: string) => {
    if (!workspaceSlug || !ticketId) return;
    setSendingComment(true);
    try {
      await createComment(workspaceSlug, ticketId, content);
      fetchComments();
    } catch {
      toast.error("Failed to add comment");
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

      {/* Header */}
      <div className="mb-6">
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={setEditName}
              autoFocus
              size="lg"
            />
            <Button size="xs" onClick={handleSaveName}>{t("ticketDetail.save")}</Button>
            <Button size="xs" color="light" onClick={() => setEditingName(false)}>{t("ticketDetail.cancel")}</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-body-bold text-heading">{ticket.name}</h2>
            {canEditName && (
              <button
                onClick={() => { setEditName(ticket.name); setEditingName(true); }}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {t("ticketDetail.edit")}
              </button>
            )}
          </div>
        )}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-body-medium text-subtle uppercase">
                {t("ticketDetail.description")}
              </p>
              {canEditFields && !editingDescription && (
                <button
                  onClick={() => {
                    setEditDescription(ticket.description);
                    setEditingDescription(true);
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t("ticketDetail.edit")}
                </button>
              )}
            </div>
            {editingDescription ? (
              <div>
                <Textarea
                  value={editDescription}
                  onChange={setEditDescription}
                  height={120}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="xs" onClick={handleSaveDescription}>
                    {t("ticketDetail.save")}
                  </Button>
                  <Button
                    size="xs"
                    color="light"
                    onClick={() => setEditingDescription(false)}
                  >
                    {t("ticketDetail.cancel")}
                  </Button>
                </div>
              </div>
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
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {canChangeStatus && (
            <Card className="p-4">
              <FormInput label={t("ticketDetail.status")} className={clsx("!mb-0")}>
                <Select
                  options={[...STATUSES]}
                  label={(s) => tEnum("status", s)}
                  value={(s) => s === ticket.status}
                  onChange={handleStatusChange}
                />
              </FormInput>
            </Card>
          )}

          {canEditFields && (
            <Card className="p-4">
              <FormInput label={t("ticketDetail.priority")} className={clsx("!mb-0")}>
                <Select
                  options={[...PRIORITIES]}
                  label={(p) => tEnum("priority", p)}
                  value={(p) => p === ticket.priority}
                  onChange={handlePriorityChange}
                />
              </FormInput>
            </Card>
          )}

          {canEditFields && (
            <Card className="p-4">
              <FormInput label={t("ticketDetail.category")} className={clsx("!mb-0")}>
                <Select
                  options={[...CATEGORIES]}
                  label={(c) => tEnum("category", c)}
                  value={(c) => c === ticket.category}
                  onChange={handleCategoryChange}
                />
              </FormInput>
            </Card>
          )}

          {canAssign && (
            <Card className="p-4">
              <FormInput label={t("ticketDetail.assignee")} className="!mb-0">
                <Select
                  options={assignableMembers}
                  label={(m) => `${m.firstName} ${m.lastName}`}
                  value={(m) => m.userId === selectedAssigneeId}
                  onChange={handleAssign}
                  placeholder={t("ticketDetail.selectAssignee")}
                />
              </FormInput>
            </Card>
          )}

          <Card className="p-4">
            <FormInput label={t("ticketDetail.tags")} className="!mb-0">
              <TagSelector
                tags={workspaceTags}
                selectedIds={ticket.tagIds}
                onChange={handleTagsChange}
                disabled={!canEditTags}
              />
            </FormInput>
          </Card>

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
