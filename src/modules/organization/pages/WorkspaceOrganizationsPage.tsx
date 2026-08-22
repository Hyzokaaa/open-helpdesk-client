import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import BrandLogo from "@modules/app/components/BrandLogo";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";
import Select from "@modules/app/modules/ui/components/Select/Select";
import {
  type Organization,
  type OrganizationMember,
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadOrganizationLogo,
  deleteOrganizationLogo,
  listOrganizationMembers,
  addOrganizationMember,
  removeOrganizationMember,
} from "../services/organization.service";
import {
  listMembers,
  type WorkspaceMember,
} from "@modules/workspace/services/workspace.service";

export default function WorkspaceOrganizationsPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Sheet state: null = closed, { mode: "create" } or { mode: "edit", org }
  const [sheet, setSheet] = useState<{ mode: "create" } | { mode: "edit"; org: Organization } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainsInput, setDomainsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Members state (for edit sheet)
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [allContacts, setAllContacts] = useState<WorkspaceMember[]>([]);
  const [addMemberUserId, setAddMemberUserId] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const canManage = can(P.ORGANIZATION_MANAGE);

  const parseDomains = (input: string): string[] =>
    input.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

  const fetchOrganizations = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listOrganizations(workspaceSlug)
      .then(setOrganizations)
      .catch(() => toast.error(t("common.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrganizations();
    if (workspaceSlug) listMembers(workspaceSlug).then(setAllContacts).catch(() => {});
  }, [workspaceSlug]);

  const openCreate = () => {
    setName("");
    setDescription("");
    setDomainsInput("");
    setNotes("");
    setSheet({ mode: "create" });
  };

  const openEdit = (org: Organization) => {
    setName(org.name);
    setDescription(org.description ?? "");
    setDomainsInput(org.domains.join(", "));
    setNotes(org.notes ?? "");
    setSheet({ mode: "edit", org });
    setOrgMembers([]);
    setAddMemberUserId(null);
    if (workspaceSlug) {
      setMembersLoading(true);
      listOrganizationMembers(workspaceSlug, org.id)
        .then(setOrgMembers)
        .catch(() => {})
        .finally(() => setMembersLoading(false));
    }
  };

  const closeSheet = () => setSheet(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !sheet) return;
    setSubmitting(true);
    try {
      if (sheet.mode === "create") {
        const created = await createOrganization(workspaceSlug, {
          name,
          description: description || undefined,
          domains: parseDomains(domainsInput),
        });
        toast.success(t("organizations.created"));
        fetchOrganizations();
        openEdit(created);
        setSubmitting(false);
        return;
      } else {
        await updateOrganization(workspaceSlug, sheet.org.id, {
          name,
          description: description || null,
          notes: notes || null,
          domains: parseDomains(domainsInput),
        });
        toast.success(t("organizations.updated"));
      }
      closeSheet();
      fetchOrganizations();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteOrganization(workspaceSlug, deleteId);
      setDeleteId(null);
      fetchOrganizations();
      toast.success(t("organizations.deleted"));
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceSlug || !sheet || sheet.mode !== "edit") return;
    if (file.size > 1024 * 1024) {
      toast.error(t("branding.logoTooLarge"));
      return;
    }
    setUploading(true);
    try {
      const result = await uploadOrganizationLogo(workspaceSlug, sheet.org.id, file);
      setSheet({ mode: "edit", org: { ...sheet.org, logo: result.logo } });
      fetchOrganizations();
      toast.success(t("organizations.logoUpdated"));
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleLogoDelete = async () => {
    if (!workspaceSlug || !sheet || sheet.mode !== "edit") return;
    try {
      await deleteOrganizationLogo(workspaceSlug, sheet.org.id);
      setSheet({ mode: "edit", org: { ...sheet.org, logo: null } });
      fetchOrganizations();
      toast.success(t("organizations.logoRemoved"));
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  const handleAddMember = async () => {
    if (!workspaceSlug || !sheet || sheet.mode !== "edit" || !addMemberUserId) return;
    try {
      await addOrganizationMember(workspaceSlug, sheet.org.id, addMemberUserId);
      setAddMemberUserId(null);
      const members = await listOrganizationMembers(workspaceSlug, sheet.org.id);
      setOrgMembers(members);
      toast.success(t("organizations.memberAdded"));
    } catch {
      toast.error(t("common.saveError"));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!workspaceSlug || !sheet || sheet.mode !== "edit") return;
    try {
      await removeOrganizationMember(workspaceSlug, sheet.org.id, userId);
      setOrgMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success(t("organizations.memberRemoved"));
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  const availableContacts = allContacts.filter(
    (c) => !orgMembers.some((m) => m.userId === c.userId),
  );

  const editingLogo = sheet?.mode === "edit" ? sheet.org.logo : null;

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <svg className="w-12 h-12 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
          </svg>
          <p className="text-sm text-heading font-body-semibold mb-1">{t("organizations.emptyTitle")}</p>
          <p className="text-xs text-muted mb-4 max-w-xs text-center">{t("organizations.emptyDescription")}</p>
          {canManage && (
            <Button size="sm" onClick={openCreate}>{t("organizations.new")}</Button>
          )}
        </div>
      ) : (
        <>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-body-bold text-heading">
            {t("organizations.title")} ({organizations.length})
          </h2>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              {t("organizations.new")}
            </Button>
          )}
        </div>
        {organizations.length > 5 && (
          <div className="mb-4">
            <Input placeholder={t("organizations.search")} value={search} onChange={setSearch} />
          </div>
        )}
        <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase w-10" />
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("organizations.name")}</th>
                <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase hidden md:table-cell">{t("organizations.domains")}</th>
                <th className="px-4 py-2 text-right text-xs font-body-semibold text-subtle uppercase hidden sm:table-cell">{t("organizations.members")}</th>
                {canManage && <th className="px-2 py-2 w-10" />}
              </tr>
            </thead>
            <tbody>
              {organizations.filter((o) => {
                if (!search) return true;
                const q = search.toLowerCase();
                return o.name.toLowerCase().includes(q) || o.domains.some((d) => d.includes(q));
              }).map((org) => (
                <tr key={org.id} className="border-b border-border-row last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-2.5">
                    {org.logo ? (
                      <BrandLogo src={org.logo} size="sm" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-surface-hover flex items-center justify-center text-xs font-body-bold text-muted">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-body-medium text-heading">{org.name}</span>
                    {org.description && (
                      <p className="text-xs text-muted truncate max-w-xs">{org.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    {org.domains.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {org.domains.map((d) => (
                          <span key={d} className="text-xs bg-surface-hover text-heading px-2 py-0.5 rounded">{d}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <span className="text-xs text-muted">{org.memberCount ?? 0}</span>
                  </td>
                  {canManage && (
                    <td className="px-2 py-2.5 text-right">
                      <ActionMenu items={[
                        { label: t("common.edit"), onClick: () => openEdit(org) },
                        { label: t("common.delete"), onClick: () => setDeleteId(org.id), danger: true },
                      ]} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Create / Edit Sheet */}
      {sheet && (
        <Sheet onClose={closeSheet}>
          <h2 className="text-lg font-body-bold text-heading mb-6">
            {sheet.mode === "create" ? t("organizations.new") : t("organizations.editTitle")}
          </h2>
          <form onSubmit={handleSubmit}>
            <FormInput label={t("organizations.name")} required>
              <Input placeholder="IMSM Ltd" value={name} onChange={setName} autoFocus />
            </FormInput>
            <FormInput label={t("organizations.description")}>
              <Input placeholder={t("organizations.descriptionPlaceholder")} value={description} onChange={setDescription} />
            </FormInput>
            <FormInput label={t("organizations.domains")}>
              <Input placeholder="imsm.com, imsm.co.uk" value={domainsInput} onChange={setDomainsInput} />
              <p className="text-exs text-muted mt-1">{t("organizations.domainsHint")}</p>
            </FormInput>

            <FormInput label={t("organizations.notes")}>
              <textarea
                className="w-full rounded-lg border border-border-card bg-surface px-3 py-2 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y min-h-[60px]"
                placeholder={t("organizations.notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </FormInput>

            {/* Logo (only in edit mode) */}
            {sheet.mode === "edit" && (
              <div className="mb-4">
                <p className="text-xs font-body-semibold text-heading mb-2">{t("branding.logo")}</p>
                <div className="flex items-center gap-3">
                  {editingLogo && (
                    <>
                      <BrandLogo src={editingLogo} size="xl" className="rounded border border-border-card p-1" />
                      <Button type="button" size="xs" color="danger" onClick={handleLogoDelete}>
                        {t("branding.removeLogo")}
                      </Button>
                    </>
                  )}
                  <Button type="button" size="xs" color="light" loading={uploading} onClick={() => fileRef.current?.click()}>
                    {editingLogo ? t("branding.changeLogo") : t("branding.uploadLogo")}
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <p className="text-exs text-muted mt-1">PNG, SVG, JPEG, WebP. Max 1MB</p>
              </div>
            )}

            {/* Members (only in edit mode) */}
            {sheet.mode === "edit" && (
              <div className="mb-4">
                <p className="text-xs font-body-semibold text-heading mb-2">
                  {t("organizations.members")} ({orgMembers.length})
                </p>

                {canManage && availableContacts.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <Select
                        options={availableContacts}
                        label={(c) => `${c.firstName} ${c.lastName} (${c.email})`}
                        value={(c) => c.userId === addMemberUserId}
                        onChange={(c) => setAddMemberUserId(c.userId)}
                        placeholder={t("organizations.addMember")}
                      />
                    </div>
                    <Button type="button" size="sm" disabled={!addMemberUserId} onClick={handleAddMember}>
                      {t("common.add")}
                    </Button>
                  </div>
                )}

                {membersLoading ? (
                  <div className="flex justify-center py-4"><Spinner width={16} /></div>
                ) : orgMembers.length === 0 ? (
                  <p className="text-xs text-muted py-2">{t("organizations.noMembers")}</p>
                ) : (
                  <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-card bg-surface-hover">
                          <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
                          <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                          {canManage && <th className="px-2 py-2 w-10" />}
                        </tr>
                      </thead>
                      <tbody>
                        {orgMembers.map((m) => (
                          <tr key={m.userId} className="border-b border-border-row last:border-0">
                            <td className="px-4 py-2">
                              <span className="text-sm font-body-medium text-heading">{m.firstName} {m.lastName}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-muted">{m.email}</span>
                            </td>
                            {canManage && (
                              <td className="px-2 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.userId)}
                                  className="text-xs text-muted hover:text-red-500 cursor-pointer transition-colors"
                                >
                                  ✕
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" size="sm" color="light" onClick={closeSheet}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={submitting}>
                {sheet.mode === "create" ? t("organizations.create") : t("common.save")}
              </Button>
            </div>
          </form>
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("common.delete")}
          message={t("organizations.confirmDelete")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
