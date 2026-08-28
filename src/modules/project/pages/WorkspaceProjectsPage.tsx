import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
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

  const [sheet, setSheet] = useState<
    | { mode: "create" }
    | { mode: "edit"; project: Project; categoriesLoading: boolean }
    | null
  >(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [allCategories, setAllCategories] = useState<TicketCategoryDto[]>([]);
  const [projectCategoryIds, setProjectCategoryIds] = useState<Set<string>>(new Set());

  const fetchProjects = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listProjects(workspaceSlug)
      .then(setProjects)
      .catch(() => toast.error(t("common.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, [workspaceSlug]);

  const openCreate = () => {
    setName("");
    setDescription("");
    setProjectCategoryIds(new Set());
    setSheet({ mode: "create" });
  };

  const openEdit = (project: Project) => {
    if (!workspaceSlug) return;
    setName(project.name);
    setDescription(project.description || "");
    setSheet({ mode: "edit", project, categoriesLoading: true });

    Promise.all([
      listCategories(workspaceSlug),
      listProjectCategories(workspaceSlug, project.id),
    ]).then(([cats, projCats]) => {
      setAllCategories(cats);
      setProjectCategoryIds(new Set(projCats.map((c) => c.id)));
      setSheet((prev) => prev?.mode === "edit" ? { ...prev, categoriesLoading: false } : prev);
    }).catch(() => {
      toast.error(t("common.loadError"));
      setSheet((prev) => prev?.mode === "edit" ? { ...prev, categoriesLoading: false } : prev);
    });
  };

  const closeSheet = () => setSheet(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !name.trim()) return;
    setSubmitting(true);
    try {
      if (sheet?.mode === "edit") {
        await updateProject(workspaceSlug, sheet.project.id, { name: name.trim(), description: description.trim() || null });
        toast.success(t("projects.updated"));
      } else {
        await createProject(workspaceSlug, { name: name.trim(), description: description.trim() || undefined });
        toast.success(t("projects.created"));
      }
      closeSheet();
      fetchProjects();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = async (categoryId: string) => {
    if (!workspaceSlug || sheet?.mode !== "edit") return;
    const isSelected = projectCategoryIds.has(categoryId);
    try {
      if (isSelected) {
        await removeProjectCategory(workspaceSlug, sheet.project.id, categoryId);
        setProjectCategoryIds((prev) => { const next = new Set(prev); next.delete(categoryId); return next; });
      } else {
        await addProjectCategory(workspaceSlug, sheet.project.id, categoryId);
        setProjectCategoryIds((prev) => new Set(prev).add(categoryId));
      }
      fetchProjects();
    } catch {
      toast.error(t("common.saveError"));
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteProject(workspaceSlug, deleteId);
      if (sheet?.mode === "edit" && sheet.project.id === deleteId) closeSheet();
      setDeleteId(null);
      fetchProjects();
      toast.success(t("projects.deleted"));
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <svg className="w-12 h-12 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <p className="text-sm text-heading font-body-semibold mb-1">{t("projects.emptyTitle")}</p>
          <p className="text-xs text-muted mb-4 max-w-xs text-center">{t("projects.emptyDescription")}</p>
          <Button size="sm" onClick={openCreate}>{t("projects.new")}</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-body-bold text-heading">
              {t("projects.title")} ({projects.length})
            </h2>
            <Button size="sm" onClick={openCreate}>{t("projects.new")}</Button>
          </div>
          <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-card bg-surface-hover">
                  <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("projects.name")}</th>
                  <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase hidden md:table-cell">{t("projects.description")}</th>
                  <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase w-28">{t("projects.categories")}</th>
                  <th className="px-2 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-border-row last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-body-medium text-heading">{p.name}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      {p.description ? (
                        <span className="text-sm text-muted truncate block max-w-xs">{p.description}</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-sm text-muted">{p.categoryCount ?? 0}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <ActionMenu items={[
                        { label: t("common.edit"), onClick: () => openEdit(p) },
                        { label: t("common.delete"), onClick: () => setDeleteId(p.id), danger: true },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sheet && (
        <Sheet onClose={closeSheet}>
          <h2 className="text-lg font-body-bold text-heading mb-6">
            {sheet.mode === "create" ? t("projects.new") : t("projects.editTitle")}
          </h2>
          <form onSubmit={handleSubmit}>
            <FormInput label={t("projects.name")} required>
              <Input value={name} onChange={setName} placeholder={t("projects.namePlaceholder")} autoFocus />
            </FormInput>
            <FormInput label={t("projects.description")}>
              <Input value={description} onChange={setDescription} />
            </FormInput>
            <div className="flex justify-end gap-3">
              <Button type="button" size="sm" color="light" onClick={closeSheet}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={submitting} disabled={!name.trim()}>
                {sheet.mode === "create" ? t("projects.new") : t("common.save")}
              </Button>
            </div>
          </form>

          {sheet.mode === "edit" && (
            <div className="mt-6 pt-6 border-t border-border-card">
              <p className="text-xs font-body-semibold text-subtle uppercase mb-3">
                {t("projects.categories")} ({projectCategoryIds.size})
              </p>

              {sheet.categoriesLoading ? (
                <div className="flex justify-center py-6"><Spinner width={20} /></div>
              ) : allCategories.length === 0 ? (
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

              <div className="mt-6 pt-6 border-t border-border-card">
                <Button size="xs" color="danger" onClick={() => { closeSheet(); setDeleteId(sheet.project.id); }}>
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("common.delete")}
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
