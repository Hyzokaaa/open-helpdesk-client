import clsx from "clsx";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
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
  return (
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
                <CustomFieldsReadonly definitions={customFieldDefs} values={draft.customFields} />
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
              <CustomFieldsReadonly definitions={customFieldDefs} values={ticket.customFields ?? {}} />
            </Card>
          )}
        </>
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
