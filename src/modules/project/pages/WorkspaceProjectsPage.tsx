import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import { useParams } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  Project,
  TicketCategoryDto,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  listCategories,
  addProjectCategory,
  removeProjectCategory,
  listProjectCategories,
} from "../services/project.service";

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  teal: "#14b8a6",
  orange: "#f97316",
  gray: "#6b7280",
};

export default function WorkspaceProjectsPage() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Category assignment (edit mode only)
  const [allCategories, setAllCategories] = useState<TicketCategoryDto[]>([]);
  const [projectCategoryIds, setProjectCategoryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!workspaceSlug) return;
    listProjects(workspaceSlug).then(setProjects).catch(() => {}).finally(() => setLoading(false));
  }, [workspaceSlug]);

  const openCreate = () => {
    setEditProject(null);
    setName("");
    setDescription("");
    setProjectCategoryIds(new Set());
    setShowSheet(true);
  };

  const openEdit = async (project: Project) => {
    if (!workspaceSlug) return;
    setEditProject(project);
    setName(project.name);
    setDescription(project.description || "");
    setShowSheet(true);

    const [cats, projCats] = await Promise.all([
      listCategories(workspaceSlug),
      listProjectCategories(workspaceSlug, project.id),
    ]);
    setAllCategories(cats);
    setProjectCategoryIds(new Set(projCats.map((c) => c.id)));
  };

  const handleSave = async () => {
    if (!workspaceSlug || !name.trim()) return;
    setSubmitting(true);
    try {
      if (editProject) {
        await updateProject(workspaceSlug, editProject.id, { name: name.trim(), description: description.trim() || null });
        toast.success(t("projects.updated"));
      } else {
        await createProject(workspaceSlug, { name: name.trim(), description: description.trim() || undefined });
        toast.success(t("projects.created"));
      }
      const updated = await listProjects(workspaceSlug);
      setProjects(updated);
      setShowSheet(false);
    } catch {
      toast.error(t("projects.created"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = async (categoryId: string) => {
    if (!workspaceSlug || !editProject) return;
    const isSelected = projectCategoryIds.has(categoryId);
    try {
      if (isSelected) {
        await removeProjectCategory(workspaceSlug, editProject.id, categoryId);
        setProjectCategoryIds((prev) => { const next = new Set(prev); next.delete(categoryId); return next; });
      } else {
        await addProjectCategory(workspaceSlug, editProject.id, categoryId);
        setProjectCategoryIds((prev) => new Set(prev).add(categoryId));
      }
      const updated = await listProjects(workspaceSlug);
      setProjects(updated);
    } catch {
      toast.error("Failed to update categories");
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteProject(workspaceSlug, deleteId);
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
      toast.success(t("projects.deleted"));
    } catch {
      toast.error(t("projects.deleted"));
    }
  };

  if (loading) return null;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="xs" color="light" onClick={openCreate}>
          {t("projects.new")}
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-heading font-body-medium mb-1">{t("projects.empty")}</p>
          <p className="text-xs text-muted">{t("projects.emptyDescription")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => openEdit(p)}
            >
              <div className="min-w-0">
                <p className="text-sm font-body-medium text-body">{p.name}</p>
                {p.description && <p className="text-exs text-muted truncate">{p.description}</p>}
              </div>
              <span className="text-xs text-muted shrink-0 ml-3">
                {p.categoryCount ?? 0} {t("projects.categories").toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {showSheet && (
        <Sheet onClose={() => setShowSheet(false)}>
          <div className="p-6">
            <h2 className="text-lg font-body-bold text-heading mb-1">
              {editProject ? t("projects.editTitle") : t("projects.new")}
            </h2>
            <p className="text-sm text-muted mb-6">
              {editProject ? t("projects.editTitle") : t("projects.new")}
            </p>

            <FormInput label={t("projects.name")} required>
              <Input value={name} onChange={setName} placeholder={t("projects.namePlaceholder")} />
            </FormInput>

            <FormInput label={t("projects.description")}>
              <Input value={description} onChange={setDescription} />
            </FormInput>

            <div className="mt-2">
              <Button size="sm" full onClick={handleSave} loading={submitting} disabled={!name.trim()}>
                {editProject ? t("settings.save") : t("projects.new")}
              </Button>
            </div>

            {editProject && (
              <>
                <div className="border-t border-border-card my-6" />

                <p className="text-xs font-body-semibold text-heading mb-1">{t("projects.categories")}</p>
                <p className="text-exs text-muted mb-3">{t("projects.categoriesHint")}</p>

                {allCategories.length === 0 ? (
                  <p className="text-xs text-muted">{t("projects.noCategoriesHint")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((cat) => {
                      const isSelected = projectCategoryIds.has(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-surface-active border-primary/30 text-heading"
                              : "bg-surface border-border-card text-muted opacity-60 hover:opacity-100"
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[cat.color] || cat.color }} />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-border-card my-6" />
                <Button size="xs" color="danger" onClick={() => { setShowSheet(false); setDeleteId(editProject.id); }}>
                  {t("tickets.delete")}
                </Button>
              </>
            )}
          </div>
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("projects.deleteTitle")}
          message={t("projects.deleteMessage")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
