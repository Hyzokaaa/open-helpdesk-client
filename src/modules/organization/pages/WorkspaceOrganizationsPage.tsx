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
import {
  type Organization,
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadOrganizationLogo,
  deleteOrganizationLogo,
} from "../services/organization.service";

export default function WorkspaceOrganizationsPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainsInput, setDomainsInput] = useState("");
  const [creating, setCreating] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDomains, setEditDomains] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);

  const canManage = can(P.ORGANIZATION_MANAGE);

  const parseDomains = (input: string): string[] =>
    input.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

  const fetchOrganizations = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listOrganizations(workspaceSlug)
      .then(setOrganizations)
      .catch(() => toast.error("Failed to load organizations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrganizations();
  }, [workspaceSlug]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(id);
      setEditingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setCreating(true);
    try {
      await createOrganization(workspaceSlug, {
        name,
        description: description || undefined,
        domains: parseDomains(domainsInput),
      });
      setName("");
      setDescription("");
      setDomainsInput("");
      setShowCreate(false);
      fetchOrganizations();
      toast.success(t("organizations.created"));
    } catch {
      toast.error("Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!workspaceSlug || !editingId) return;
    setSaving(true);
    try {
      await updateOrganization(workspaceSlug, editingId, {
        name: editName,
        description: editDescription || null,
        domains: parseDomains(editDomains),
      });
      setEditingId(null);
      fetchOrganizations();
      toast.success(t("organizations.updated"));
    } catch {
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteOrganization(workspaceSlug, deleteId);
      if (expandedId === deleteId) setExpandedId(null);
      setDeleteId(null);
      fetchOrganizations();
      toast.success(t("organizations.deleted"));
    } catch {
      toast.error("Failed to delete organization");
    }
  };

  const handleLogoUpload = async (orgId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceSlug) return;
    if (file.size > 1024 * 1024) {
      toast.error(t("branding.logoTooLarge"));
      return;
    }
    setUploadingLogoId(orgId);
    try {
      await uploadOrganizationLogo(workspaceSlug, orgId, file);
      fetchOrganizations();
      toast.success(t("organizations.logoUpdated"));
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogoId(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleLogoDelete = async (orgId: string) => {
    if (!workspaceSlug) return;
    try {
      await deleteOrganizationLogo(workspaceSlug, orgId);
      fetchOrganizations();
      toast.success(t("organizations.logoRemoved"));
    } catch {
      toast.error("Failed to delete logo");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">{t("organizations.title")}</h2>
        {canManage && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            {t("organizations.new")}
          </Button>
        )}
      </div>

      {showCreate && (
        <Sheet onClose={() => setShowCreate(false)}>
          <h2 className="text-lg font-body-bold text-heading mb-6">
            {t("organizations.new")}
          </h2>
          <form onSubmit={handleCreate}>
            <FormInput label={t("organizations.name")} required>
              <Input placeholder="IMSM Ltd" value={name} onChange={setName} autoFocus />
            </FormInput>
            <FormInput label={t("organizations.description")}>
              <Input placeholder={t("organizations.description")} value={description} onChange={setDescription} />
            </FormInput>
            <FormInput label={t("organizations.domains")}>
              <Input placeholder="imsm.com, imsm.co.uk" value={domainsInput} onChange={setDomainsInput} />
              <p className="text-exs text-muted mt-1">{t("organizations.domainsHint")}</p>
            </FormInput>
            <div className="flex justify-end gap-3">
              <Button size="sm" color="light" onClick={() => setShowCreate(false)}>
                {t("tags.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={creating}>{t("organizations.create")}</Button>
            </div>
          </form>
        </Sheet>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : organizations.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("organizations.empty")}</p>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => {
            const isExpanded = expandedId === org.id;
            const isEditing = editingId === org.id;

            return (
              <div key={org.id} className="bg-surface border border-border-card rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => toggleExpand(org.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg
                      className={`w-4 h-4 text-muted shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {org.logo && <BrandLogo src={org.logo} size="sm" />}
                    <div className="min-w-0">
                      <span className="text-sm font-body-semibold text-heading">{org.name}</span>
                      {org.domains.length > 0 && (
                        <span className="text-xs text-muted ml-2 hidden sm:inline">{org.domains.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <ActionMenu items={[
                        {
                          label: t("ticketDetail.edit"),
                          onClick: () => {
                            setExpandedId(org.id);
                            setEditingId(org.id);
                            setEditName(org.name);
                            setEditDescription(org.description ?? "");
                            setEditDomains(org.domains.join(", "));
                          },
                        },
                        { label: t("common.delete"), onClick: () => setDeleteId(org.id), danger: true },
                      ]} />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border-card px-4 py-4">
                    {isEditing && (
                      <div className="mb-4 pb-4 border-b border-border-card">
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <FormInput label={t("organizations.name")} required>
                                <Input value={editName} onChange={setEditName} />
                              </FormInput>
                            </div>
                            <div className="flex-1">
                              <FormInput label={t("organizations.description")}>
                                <Input value={editDescription} onChange={setEditDescription} />
                              </FormInput>
                            </div>
                          </div>
                          <FormInput label={t("organizations.domains")}>
                            <Input value={editDomains} onChange={setEditDomains} placeholder="imsm.com, imsm.co.uk" />
                            <p className="text-exs text-muted mt-1">{t("organizations.domainsHint")}</p>
                          </FormInput>
                          <div className="flex gap-2">
                            <Button size="sm" loading={saving} onClick={handleUpdate}>
                              {t("branding.save")}
                            </Button>
                            <Button size="sm" color="light" onClick={() => setEditingId(null)}>
                              {t("tags.cancel")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Logo section */}
                    {canManage && (
                      <div>
                        <p className="text-xs font-body-semibold text-subtle uppercase mb-3">{t("branding.logo")}</p>
                        <div className="flex items-center gap-3">
                          {org.logo && (
                            <>
                              <BrandLogo src={org.logo} size="xl" className="rounded border border-border-card p-1" />
                              <Button size="xs" color="danger" onClick={() => handleLogoDelete(org.id)}>
                                {t("branding.removeLogo")}
                              </Button>
                            </>
                          )}
                          <Button
                            size="xs"
                            color="light"
                            loading={uploadingLogoId === org.id}
                            onClick={() => {
                              setUploadingLogoId(org.id);
                              fileRef.current?.click();
                            }}
                          >
                            {org.logo ? t("branding.changeLogo") : t("branding.uploadLogo")}
                          </Button>
                        </div>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (uploadingLogoId) handleLogoUpload(uploadingLogoId, e);
                          }}
                        />
                      </div>
                    )}

                    {/* Info when not editing */}
                    {!isEditing && (
                      <div className="mt-3 space-y-2">
                        {org.description && (
                          <p className="text-sm text-muted">{org.description}</p>
                        )}
                        {org.domains.length > 0 && (
                          <div>
                            <p className="text-xs font-body-semibold text-subtle uppercase mb-1">{t("organizations.domains")}</p>
                            <div className="flex flex-wrap gap-1">
                              {org.domains.map((d) => (
                                <span key={d} className="text-xs bg-surface-hover text-heading px-2 py-0.5 rounded">{d}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
