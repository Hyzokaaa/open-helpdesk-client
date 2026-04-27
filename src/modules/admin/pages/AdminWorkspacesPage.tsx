import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import useColumnDrag from "@modules/shared/hooks/useColumnDrag";
import SortableTh from "@modules/app/modules/ui/components/SortableTh/SortableTh";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import WorkspaceSettingsPage from "@modules/workspace/pages/WorkspaceSettingsPage";
import useUser from "@modules/user/hooks/useUser";
import {
  Workspace,
  listWorkspaces,
  createWorkspace,
  deleteWorkspace,
} from "@modules/workspace/services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function AdminWorkspacesPage() {
  const { user } = useUser();
  const { t } = useTranslation();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);
  const [confirmDeleteWs, setConfirmDeleteWs] = useState<string | null>(null);
  const [editingWsSlug, setEditingWsSlug] = useState<string | null>(null);

  const columns = [
    { key: "name", label: t("admin.col.name"), sortable: true, sortField: "name" },
    { key: "slug", label: t("admin.col.slug"), sortable: true, sortField: "slug" },
    { key: "description", label: t("admin.col.description") },
    { key: "owner", label: t("admin.col.owner") },
    { key: "actions", label: t("admin.col.actions"), width: "220px" },
  ];

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };
  const sensors = useSensors(useSensor(PointerSensor));
  const { order, handleDragEnd, reorder } = useColumnDrag(columns.map((c) => c.key));

  if (!user?.isSystemAdmin) return <Navigate to="/dashboard" replace />;

  const fetchData = async () => {
    setLoading(true);
    try {
      const w = await listWorkspaces({ sortBy, sortOrder });
      setWorkspaces(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [sortBy, sortOrder]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingWs(true);
    try {
      await createWorkspace({ name: wsName, description: wsDescription });
      setWsName(""); setWsDescription("");
      setShowCreateWs(false);
      fetchData();
      toast.success(t("workspaces.created"));
    } catch { toast.error("Failed to create workspace"); }
    finally { setCreatingWs(false); }
  };

  const handleDeleteWorkspace = async (slug: string) => {
    try {
      await deleteWorkspace(slug);
      setConfirmDeleteWs(null);
      fetchData();
      toast.success(t("workspaces.deleted"));
    } catch { toast.error(t("workspaces.deleteError")); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full">
      {confirmDeleteWs && (
        <ConfirmModal
          title={t("workspaceSettings.deleteTitle")}
          message={t("workspaceSettings.deleteMessage")}
          confirmLabel={t("workspaceSettings.deleteConfirm")}
          danger
          onConfirm={() => handleDeleteWorkspace(confirmDeleteWs)}
          onCancel={() => setConfirmDeleteWs(null)}
        />
      )}

      {editingWsSlug && (
        <Sheet onClose={() => { setEditingWsSlug(null); fetchData(); }}>
          <WorkspaceSettingsPage workspaceSlugProp={editingWsSlug} onClose={() => { setEditingWsSlug(null); fetchData(); }} />
        </Sheet>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("admin.manageWorkspaces")}</h2>
        <Button size="sm" onClick={() => setShowCreateWs(!showCreateWs)}>
          {showCreateWs ? t("workspaces.cancel") : t("workspaces.new")}
        </Button>
      </div>

      {showCreateWs && (
        <Card className="p-5 mb-4">
          <form onSubmit={handleCreateWorkspace}>
            <div className="flex gap-4">
              <FormInput label={t("workspaces.name")} required className="flex-1">
                <Input placeholder={t("workspaces.namePlaceholder")} value={wsName} onChange={setWsName} />
              </FormInput>
              <FormInput label={t("workspaces.description")} className="flex-1">
                <Input placeholder={t("workspaces.descriptionPlaceholder")} value={wsDescription} onChange={setWsDescription} />
              </FormInput>
            </div>
            <Button type="submit" size="sm" loading={creatingWs} disabled={!wsName.trim()}>{t("workspaces.create")}</Button>
          </form>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <SortableContext items={order} strategy={horizontalListSortingStrategy}>
            <tr className="border-b border-border-card bg-surface-hover">
              {reorder(columns).map((col) => (
                <SortableTh
                  key={col.key}
                  id={col.key}
                  width={col.width}
                  sortable={col.sortable}
                  onClick={() => col.sortable && col.sortField && toggleSort(col.sortField)}
                >
                  {col.label}
                  {col.sortField && sortBy === col.sortField && (
                    <span className="text-primary">
                      {sortOrder === "ASC" ? "↑" : "↓"}
                    </span>
                  )}
                </SortableTh>
              ))}
            </tr>
            </SortableContext>
          </thead>
          <tbody>
            {workspaces.map((ws) => (
              <tr key={ws.id} className="border-b border-border-row">
                {reorder(columns).map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.key === "name" && (
                      <span className="text-sm font-body-semibold text-heading">{ws.name}</span>
                    )}
                    {col.key === "slug" && (
                      <span className="text-sm text-muted">{ws.slug}</span>
                    )}
                    {col.key === "description" && (
                      <span className="text-sm text-muted">{ws.description || "-"}</span>
                    )}
                    {col.key === "owner" && (
                      <span className="text-sm text-muted">{ws.ownerName || "-"}</span>
                    )}
                    {col.key === "actions" && (
                      <div className="flex gap-2">
                        <Button size="xs" color="light" onClick={() => setEditingWsSlug(ws.slug)}>
                          {t("workspaces.edit")}
                        </Button>
                        <Button size="xs" color="danger" onClick={() => setConfirmDeleteWs(ws.slug)}>
                          {t("workspaces.delete")}
                        </Button>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted">{t("workspaces.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </DndContext>
    </div>
  );
}
