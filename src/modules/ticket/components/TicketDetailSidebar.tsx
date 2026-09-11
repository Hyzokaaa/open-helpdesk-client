import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import UserAvatar from "@modules/user/components/UserAvatar";
import MemberLink from "./MemberLink";
import PropertyRow from "./PropertyRow";
import TagSelector from "@modules/tag/components/TagSelector";
import CustomFieldsForm from "@modules/custom-field/components/CustomFieldsForm";
import SlaStatusCard from "./SlaStatusCard";
import PendingTransferCard from "./PendingTransferCard";
import TicketFollowersCard from "./TicketFollowersCard";
import TicketDetailsCard from "./TicketDetailsCard";
import CustomFieldsReadonly from "./CustomFieldsReadonly";
import {
  STATUSES,
  PRIORITIES,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "../domain/ticket-enums";
import { listCategories } from "@modules/project/services/project.service";
import type { TicketDetail, PendingTransfer, TicketParticipant } from "../services/ticket.service";
import type { Draft } from "../hooks/useTicketEdit";
import type { TicketCategoryDto, Project } from "@modules/project/services/project.service";
import type { WorkspaceMember, SlaPolicy } from "@modules/workspace/services/workspace.service";
import type { Tag } from "@modules/tag/services/tag.service";
import type { Department } from "@modules/department/services/department.service";
import type { Organization } from "@modules/organization/services/organization.service";
import type { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";

interface TicketDetailSidebarProps {
  ticket: TicketDetail;
  draft: Draft | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  isEditing: boolean;
  canChangeStatus: boolean;
  canEditFields: boolean;
  canAssign: boolean;
  canTransfer: boolean | null;
  canDelete: boolean;
  canEditTags: boolean;
  canEditCustomFields: boolean;
  isTerminal: boolean;
  pendingTransfer: PendingTransfer | null;
  participants: TicketParticipant[];
  members: WorkspaceMember[];
  wsCategories: TicketCategoryDto[];
  wsProjects: Project[];
  editCategories: TicketCategoryDto[];
  setEditCategories: React.Dispatch<React.SetStateAction<TicketCategoryDto[]>>;
  workspaceTags: Tag[];
  departments: Department[];
  organizations: Organization[];
  assignableMembers: WorkspaceMember[];
  customFieldDefs: CustomFieldDefinition[];
  slaPolicy: SlaPolicy | null;
  slaLocked: boolean;
  workspaceSlug: string | undefined;
  ticketId: string | undefined;
  userId: string | undefined;
  getMemberName: (id: string) => string;
  fetchTicket: (refreshActivity?: boolean) => void;
  fetchParticipants: () => void;
  handleDraftStatusChange: (status: string) => void;
  handleDelete: () => void;
  setShowTransferModal: (show: boolean) => void;
  navigate: (path: string) => void;
  formatDate: (date: string) => string;
  t: (key: any) => string;
  tEnum: (prefix: string, value: string) => string;
}

const EMPTY = <span className="text-xs text-muted">—</span>;

export default function TicketDetailSidebar({
  ticket, draft, setDraft,
  isEditing,
  canChangeStatus, canEditFields, canAssign, canTransfer, canDelete, canEditTags, canEditCustomFields,
  isTerminal,
  pendingTransfer, participants, members,
  wsCategories, wsProjects, editCategories, setEditCategories,
  workspaceTags, departments, organizations,
  assignableMembers, customFieldDefs,
  slaPolicy, slaLocked,
  workspaceSlug, ticketId, userId,
  getMemberName, fetchTicket, fetchParticipants,
  handleDraftStatusChange, handleDelete, setShowTransferModal,
  navigate, formatDate, t, tEnum,
}: TicketDetailSidebarProps) {
  const editing = isEditing && draft !== null;
  const v = draft ?? ticket;
  const assignee = members.find((m) => m.userId === v.assigneeId);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-xs text-subtle font-body-semibold mb-1">
          {t("ticketDetail.properties")}
        </p>

        <div className="divide-y divide-border-card/50">
          <PropertyRow label={t("ticketDetail.status")} control={editing && canChangeStatus}>
            {editing && canChangeStatus ? (
              <Select
                options={[...STATUSES]}
                label={(s) => tEnum("status", s)}
                value={(s) => s === v.status}
                onChange={handleDraftStatusChange}
              />
            ) : (
              <StatusBadge label={tEnum("status", v.status)} color={STATUS_COLORS[v.status] || "gray"} size="xs" />
            )}
          </PropertyRow>

          <PropertyRow label={t("ticketDetail.priority")} control={editing && canEditFields}>
            {editing && canEditFields ? (
              <Select
                options={[...PRIORITIES]}
                label={(p) => tEnum("priority", p)}
                value={(p) => p === v.priority}
                onChange={(p) => setDraft((d) => d ? { ...d, priority: p } : d)}
              />
            ) : (
              <StatusBadge label={tEnum("priority", v.priority)} color={PRIORITY_COLORS[v.priority] || "gray"} size="xs" />
            )}
          </PropertyRow>

          {wsProjects.length > 0 && (
            <PropertyRow label={t("ticketDetail.project")} control={editing && canEditFields}>
              {editing && canEditFields ? (
                <Select
                  options={[{ id: "", name: "—", description: null } as Project, ...wsProjects]}
                  label={(p) => p.name}
                  value={(p) => p.id === (v.projectId ?? "")}
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
              ) : v.projectId ? (
                <StatusBadge label={wsProjects.find((p) => p.id === v.projectId)?.name ?? "—"} color="primary" size="xs" />
              ) : EMPTY}
            </PropertyRow>
          )}

          <PropertyRow label={t("ticketDetail.category")} control={editing && canEditFields}>
            {editing && canEditFields ? (
              <Select
                options={editCategories.length > 0 ? editCategories : wsCategories}
                label={(c) => c.name}
                value={(c) => c.id === v.categoryId}
                onChange={(c) => setDraft((d) => d ? { ...d, categoryId: c.id } : d)}
              />
            ) : (() => {
              const cat = wsCategories.find((c) => c.id === v.categoryId);
              return <StatusBadge label={cat?.name ?? "—"} color={(cat?.color as any) || "primary"} size="xs" />;
            })()}
          </PropertyRow>

          {departments.length > 0 && (
            <PropertyRow label={t("ticketDetail.department")} control={editing && canAssign}>
              {editing && canAssign ? (
                <Select
                  options={[{ id: "", name: "—", description: "" } as Department, ...departments]}
                  label={(d) => d.name}
                  value={(d) => d.id === (v.departmentId ?? "")}
                  onChange={(d) => setDraft((prev) => prev ? { ...prev, departmentId: d.id || null } : prev)}
                />
              ) : v.departmentId ? (
                <StatusBadge label={departments.find((d) => d.id === v.departmentId)?.name ?? "—"} color="primary" size="xs" />
              ) : EMPTY}
            </PropertyRow>
          )}

          {organizations.length > 0 && (
            <PropertyRow label={t("ticketDetail.organization")} control={editing && canAssign}>
              {editing && canAssign ? (
                <Select
                  options={[{ id: "", name: "—", description: null, notes: null, domains: [], logo: null } as Organization, ...organizations]}
                  label={(o) => o.name}
                  value={(o) => o.id === (v.organizationId ?? "")}
                  onChange={(o) => setDraft((prev) => prev ? { ...prev, organizationId: o.id || null } : prev)}
                />
              ) : v.organizationId ? (
                <StatusBadge label={organizations.find((o) => o.id === v.organizationId)?.name ?? "—"} color="primary" size="xs" />
              ) : EMPTY}
            </PropertyRow>
          )}

          <PropertyRow label={t("ticketDetail.assignee")} control={editing && canAssign}>
            {editing && canAssign ? (
              <Select
                options={assignableMembers}
                label={(m) => `${m.firstName} ${m.lastName}`}
                value={(m) => m.userId === v.assigneeId}
                onChange={(m) => setDraft((d) => d ? { ...d, assigneeId: m.userId } : d)}
                placeholder={t("ticketDetail.selectAssignee")}
              />
            ) : v.assigneeId ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar avatarUrl={assignee?.avatarUrl} firstName={assignee?.firstName} lastName={assignee?.lastName} size="sm" />
                  <MemberLink
                    userId={v.assigneeId}
                    members={members}
                    getMemberName={getMemberName}
                    navigate={navigate}
                    workspaceSlug={workspaceSlug}
                    align="left"
                  />
                </div>
                {canTransfer && !pendingTransfer && (
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="mt-1 text-xs text-primary font-body-medium hover:underline cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {t("tickets.transfer")}
                  </button>
                )}
              </div>
            ) : EMPTY}
          </PropertyRow>

          <PropertyRow label={t("ticketDetail.source")}>
            <StatusBadge label={tEnum("source", ticket.source)} color="gray" size="xs" />
          </PropertyRow>

          {ticket.originDate && (
            <PropertyRow label={t("ticketDetail.originalDate")}>
              <span className="text-xs text-body">{formatDate(ticket.originDate)}</span>
            </PropertyRow>
          )}
        </div>
      </Card>

      {pendingTransfer && workspaceSlug && ticketId && (
        <PendingTransferCard
          pendingTransfer={pendingTransfer}
          workspaceSlug={workspaceSlug}
          ticketId={ticketId}
          userId={userId}
          fetchTicket={fetchTicket}
          t={t}
        />
      )}

      <Card className="p-4">
        <p className="text-xs text-subtle font-body-semibold mb-2">{t("ticketDetail.tags")}</p>
        <TagSelector
          tags={workspaceTags}
          selectedIds={v.tagIds}
          onChange={(ids) => setDraft((d) => d ? { ...d, tagIds: ids } : d)}
          disabled={!editing || !canEditTags}
        />
      </Card>

      {customFieldDefs.length > 0 && (
        <Card className="p-4">
          {editing && canEditCustomFields ? (
            <CustomFieldsForm
              definitions={customFieldDefs}
              values={v.customFields ?? {}}
              onChange={(values) => setDraft((d) => d ? { ...d, customFields: values } : d)}
            />
          ) : (
            <CustomFieldsReadonly definitions={customFieldDefs} values={v.customFields ?? {}} />
          )}
        </Card>
      )}

      <TicketFollowersCard
        participants={participants}
        canAssign={canAssign}
        workspaceSlug={workspaceSlug}
        ticketId={ticketId}
        fetchParticipants={fetchParticipants}
        t={t}
      />

      <TicketDetailsCard
        ticket={ticket}
        members={members}
        getMemberName={getMemberName}
        navigate={navigate}
        workspaceSlug={workspaceSlug}
        isTerminal={isTerminal}
        formatDate={formatDate}
        t={t}
      />

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
  );
}
