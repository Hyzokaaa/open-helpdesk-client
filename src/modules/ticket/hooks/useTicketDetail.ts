import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  TicketDetail,
  PendingTransfer,
  TicketParticipant,
  getTicket,
  getPendingTransfer,
  listParticipants,
} from "../services/ticket.service";
import {
  CommentItem,
  listComments,
} from "@modules/comment/services/comment.service";
import {
  AttachmentDetail,
  listTicketAttachments,
  uploadToTicket,
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
import { CannedResponse, listCannedResponses } from "@modules/canned-response/services/canned-response.service";
import { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";
import { listCustomFields } from "@modules/custom-field/services/custom-field.service";
import { listCategories, listProjects, type TicketCategoryDto, type Project } from "@modules/project/services/project.service";
import useWebSocket from "@modules/shared/hooks/useWebSocket";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";

interface UseTicketDetailOptions {
  workspaceSlug: string | undefined;
  ticketId: string | undefined;
  isPlanLimitError: (err: unknown) => boolean;
  t: (key: any) => string;
}

export default function useTicketDetail({ workspaceSlug, ticketId, isPlanLimitError, t }: UseTicketDetailOptions) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
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
  const [slaPolicy, setSlaPolicy] = useState<SlaPolicy | null>(null);
  const [slaLocked, setSlaLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityKey, setActivityKey] = useState(0);

  const { can } = usePermissions(workspaceSlug);

  const fetchTicket = (refreshActivity = false) => {
    if (!workspaceSlug || !ticketId) return;
    getTicket(workspaceSlug, ticketId)
      .then((data) => {
        setTicket(data);
        if (refreshActivity) setActivityKey((k) => k + 1);
        getPendingTransfer(workspaceSlug, ticketId).then(setPendingTransfer).catch(() => setPendingTransfer(null));
      })
      .catch(() => toast.error(t("ticketDetail.notFound")))
      .finally(() => setLoading(false));
  };

  const fetchComments = () => {
    if (!workspaceSlug || !ticketId) return;
    listComments(workspaceSlug, ticketId).then((res) => setComments(res.items));
  };

  const fetchAttachments = () => {
    if (!workspaceSlug || !ticketId) return;
    listTicketAttachments(workspaceSlug, ticketId).then(setAttachments);
  };

  const fetchParticipants = () => {
    if (!workspaceSlug || !ticketId) return;
    listParticipants(workspaceSlug, ticketId).then(setParticipants).catch(() => {});
  };

  useEffect(() => {
    fetchTicket();
    fetchComments();
    fetchAttachments();
    if (workspaceSlug) {
      listMembers(workspaceSlug).then(setMembers);
      listTags(workspaceSlug).then(setWorkspaceTags);
      listDepartments(workspaceSlug).then(setDepartments).catch(() => {});
      listOrganizations(workspaceSlug).then(setOrganizations).catch(() => {});
      listCustomFields(workspaceSlug).then(setCustomFieldDefs).catch(() => {});
      listCategories(workspaceSlug).then(setWsCategories).catch(() => {});
      listProjects(workspaceSlug).then(setWsProjects).catch(() => {});
      getSlaPolicy(workspaceSlug, { silent: true })
        .then((r) => { setSlaPolicy(r.slaPolicy); setSlaLocked(false); })
        .catch((err) => { if (isPlanLimitError(err)) setSlaLocked(true); });
    }
    fetchParticipants();
  }, [workspaceSlug, ticketId]);

  useEffect(() => {
    if (workspaceSlug && can(P.CANNED_RESPONSE_VIEW)) {
      listCannedResponses(workspaceSlug, { silent: true }).then(setCannedResponses).catch(() => {});
    }
  }, [workspaceSlug, can(P.CANNED_RESPONSE_VIEW)]);

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
          toast.error(`${t("ticketDetail.uploadError")} ${file.name}`);
        }
      }
      fetchAttachments();
      toast.info(`${newFiles.length} ${t("ticketDetail.filesUploaded")}`);
    },
    [workspaceSlug, ticketId],
  );

  const getMemberName = (userId: string) => {
    const m = members.find((m) => m.userId === userId);
    return m ? `${m.firstName} ${m.lastName}` : userId;
  };

  const assignableMembers = members.filter(
    (m) => m.role === "admin" || m.role === "agent",
  );

  return {
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
  };
}
