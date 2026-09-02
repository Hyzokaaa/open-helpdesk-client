import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import Select from "@modules/app/modules/ui/components/Select/Select";
import {
  WorkspaceMember,
  listMembers,
  removeMember,
  updateContactName,
  updateMemberOrganization,
} from "../services/workspace.service";
import { Organization, listOrganizations } from "@modules/organization/services/organization.service";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function WorkspaceContactsPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<WorkspaceMember | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editOrgId, setEditOrgId] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  const canManage = can(P.WORKSPACE_MEMBERS_MANAGE);

  const fetchContacts = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listMembers(workspaceSlug)
      .then((all) => setContacts(all.filter((m) => m.role === "user")))
      .catch(() => toast.error(t("contacts.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContacts();
    if (workspaceSlug) listOrganizations(workspaceSlug).then(setOrgs).catch(() => {});
  }, [workspaceSlug]);

  const handleEditContact = (m: WorkspaceMember) => {
    setEditingContact(m);
    setEditFirstName(m.firstName);
    setEditLastName(m.lastName);
    setEditOrgId(m.organizationId);
  };

  const handleSaveContactName = async () => {
    if (!workspaceSlug || !editingContact) return;
    try {
      await updateContactName(workspaceSlug, editingContact.userId, editFirstName, editLastName);
      if (editOrgId !== editingContact.organizationId) {
        await updateMemberOrganization(workspaceSlug, editingContact.userId, editOrgId);
      }
      setEditingContact(null);
      fetchContacts();
      toast.success(t("members.nameUpdated"));
    } catch {
      toast.error(t("contacts.updateError"));
    }
  };

  const handleRemove = async () => {
    if (!workspaceSlug || !removeMemberId) return;
    try {
      await removeMember(workspaceSlug, removeMemberId);
      setRemoveMemberId(null);
      fetchContacts();
      toast.success(t("members.removed"));
    } catch {
      toast.error(t("members.removeError"));
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("sidebar.contacts")}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("members.noContacts")}</p>
      ) : (
        <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase w-[200px]">{t("admin.col.name")}</th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                {orgs.length > 0 && <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase hidden md:table-cell">{t("ticketDetail.organization")}</th>}
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase w-[90px]">{t("contacts.origin")}</th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((m) => (
                <tr key={m.id} className="border-b border-border-row">
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-sm font-body-semibold text-heading block truncate">{m.firstName} {m.lastName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted block truncate" title={m.email}>{m.email}</span>
                  </td>
                  {orgs.length > 0 && (
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted">{m.organizationId ? orgs.find((o) => o.id === m.organizationId)?.name ?? "—" : "—"}</span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={m.autoCreated ? t("contacts.fromEmail") : t("contacts.invited")}
                      color="gray"
                      size="xs"
                    />
                  </td>
                  <td className="px-2 py-3">
                    {(canManage || can(P.REPORT_VIEW)) && (
                      <ActionMenu items={[
                        ...(can(P.REPORT_VIEW) ? [{
                          label: t("members.viewStats"),
                          onClick: () => navigate(`/dashboard/workspaces/${workspaceSlug}/stats/${m.userId}`),
                        }] : []),
                        ...(canManage ? [{
                          label: t("members.editName"),
                          onClick: () => handleEditContact(m),
                        }] : []),
                        ...(canManage ? [{
                          label: t("members.remove"),
                          onClick: () => setRemoveMemberId(m.userId),
                          danger: true,
                        }] : []),
                      ]} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingContact && (
        <Sheet onClose={() => setEditingContact(null)}>
          <h3 className="text-lg font-body-bold text-heading mb-4">{t("members.editName")}</h3>
          <p className="text-xs text-muted mb-3">{editingContact.email}</p>
          <div className="flex gap-3 mb-4">
            <FormInput label={t("admin.firstName")} className="flex-1">
              <Input value={editFirstName} onChange={setEditFirstName} />
            </FormInput>
            <FormInput label={t("admin.lastName")} className="flex-1">
              <Input value={editLastName} onChange={setEditLastName} />
            </FormInput>
          </div>
          {orgs.length > 0 && (
            <FormInput label={t("ticketDetail.organization")} className="mb-4">
              <Select
                options={[{ id: "", name: "—", description: null, notes: null, domains: [], logo: null } as Organization, ...orgs]}
                label={(o) => o.name}
                value={(o) => o.id === (editOrgId ?? "")}
                onChange={(o) => setEditOrgId(o.id || null)}
              />
            </FormInput>
          )}
          <div className="flex gap-2 justify-end">
            <Button size="sm" color="light" onClick={() => setEditingContact(null)}>{t("members.cancel")}</Button>
            <Button size="sm" onClick={handleSaveContactName}>{t("members.save")}</Button>
          </div>
        </Sheet>
      )}

      {removeMemberId && (
        <ConfirmModal
          title={t("members.remove")}
          message={t("common.confirmDeleteMessage")}
          confirmLabel={t("members.remove")}
          danger
          onConfirm={handleRemove}
          onCancel={() => setRemoveMemberId(null)}
        />
      )}
    </div>
  );
}
