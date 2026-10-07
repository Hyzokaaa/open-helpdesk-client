import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import useColumnDrag from "@modules/shared/hooks/useColumnDrag";
import SortableTh from "@modules/app/modules/ui/components/SortableTh/SortableTh";
import Button from "@modules/app/modules/ui/components/Button/Button";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import DeleteWorkspaceModal from "@modules/workspace/components/DeleteWorkspaceModal";
import AdminDeletedWorkspaces from "../components/AdminDeletedWorkspaces";
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
  const [confirmDeleteWs, setConfirmDeleteWs] = useState<Workspace | null>(null);
  const [deletingWs, setDeletingWs] = useState(false);
  const [deletedRefresh, setDeletedRefresh] = useState(0);
  const [editingWsSlug, setEditingWsSlug] = useState<string | null>(null);

  const columns = [
    { key: "name", label: t("admin.col.name"), sortable: true, sortField: "name" },
    { key: "slug", label: t("admin.col.slug"), sortable: true, sortField: "slug" },
    { key: "description", label: t("admin.col.description"), sortable: true, sortField: "description" },
    { key: "owner", label: t("admin.col.owner"), sortable: true, sortField: "ownerName" },
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

  if (!user?.isSystemAdmin) return <Navigate to="/dashboard" replace />;

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingWs(true);
    try {
      await createWorkspace({ name: wsName, description: wsDescription });
      setWsName(""); setWsDescription("");
      setShowCreateWs(false);
      fetchData();
      toast.success(t("workspaces.created"));
    } catch (err: any) { if (!err?.handled) toast.error(t("admin.createWorkspaceError")); }
    finally { setCreatingWs(false); }
  };

  const handleDeleteWorkspace = async (ws: Workspace, typedName: string) => {
    setDeletingWs(true);
    try {
      await deleteWorkspace(ws.slug, typedName);
      setConfirmDeleteWs(null);
      fetchData();
      setDeletedRefresh((n) => n + 1);
      toast.success(t("workspaceDelete.deleted"));
    } catch (err) {
      const e = err as { handled?: boolean; message?: string };
      if (!e?.handled) toast.error(e?.message || t("workspaces.deleteError"));
    } finally {
      setDeletingWs(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full">
      {confirmDeleteWs && (
        <DeleteWorkspaceModal
          workspaceName={confirmDeleteWs.name}
          busy={deletingWs}
          onConfirm={(typedName) => handleDeleteWorkspace(confirmDeleteWs, typedName)}
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
        <Sheet onClose={() => setShowCreateWs(false)}>
          <h3 className="text-lg font-body-bold text-heading mb-4">{t("workspaces.new")}</h3>
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
        </Sheet>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <SortableContext items={order} strategy={horizontalListSortingStrategy}>
            <tr className="border-b border-border-card bg-surface-hover">
              {reorder(columns).map((col) => (
                <SortableTh
                  key={col.key}
                  id={col.key}
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
              <th className="px-2 py-3 bg-surface-hover sticky right-0 w-10" />
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
                  </td>
                ))}
                <td className="px-2 py-3 sticky right-0 bg-surface">
                  <ActionMenu items={[
                    {
                      label: t("workspaces.edit"),
                      onClick: () => setEditingWsSlug(ws.slug),
                    },
                    {
                      label: t("workspaces.delete"),
                      onClick: () => setConfirmDeleteWs(ws),
                      danger: true,
                    },
                  ]} />
                </td>
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-muted">{t("workspaces.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </DndContext>

      <AdminDeletedWorkspaces refreshKey={deletedRefresh} onRestored={fetchData} />
    </div>
  );
}
