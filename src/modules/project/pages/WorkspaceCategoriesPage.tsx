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
  TicketCategoryDto,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/project.service";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const COLORS = [
  { name: "Red", value: "red" },
  { name: "Yellow", value: "yellow" },
  { name: "Green", value: "green" },
  { name: "Blue", value: "blue" },
  { name: "Purple", value: "purple" },
  { name: "Pink", value: "pink" },
  { name: "Teal", value: "teal" },
  { name: "Orange", value: "orange" },
  { name: "Gray", value: "gray" },
];

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

export default function WorkspaceCategoriesPage() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [sheet, setSheet] = useState<
    | { mode: "create" }
    | { mode: "edit"; category: TicketCategoryDto }
    | null
  >(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("blue");
  const [slugManual, setSlugManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listCategories(workspaceSlug)
      .then(setCategories)
      .catch(() => toast.error(t("common.loadError")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, [workspaceSlug]);

  const openCreate = () => {
    setName("");
    setSlug("");
    setColor("blue");
    setSlugManual(false);
    setSheet({ mode: "create" });
  };

  const openEdit = (cat: TicketCategoryDto) => {
    setName(cat.name);
    setSlug(cat.slug);
    setColor(cat.color);
    setSlugManual(true);
    setSheet({ mode: "edit", category: cat });
  };

  const closeSheet = () => setSheet(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug || !name.trim() || !slug.trim()) return;
    setSubmitting(true);
    try {
      if (sheet?.mode === "edit") {
        await updateCategory(workspaceSlug, sheet.category.id, { name: name.trim(), slug: slug.trim(), color });
        toast.success(t("categories.updated"));
      } else {
        await createCategory(workspaceSlug, { name: name.trim(), slug: slug.trim(), color });
        toast.success(t("categories.created"));
      }
      closeSheet();
      fetchCategories();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteCategory(workspaceSlug, deleteId);
      if (sheet?.mode === "edit" && sheet.category.id === deleteId) closeSheet();
      setDeleteId(null);
      fetchCategories();
      toast.success(t("categories.deleted"));
    } catch {
      toast.error(t("common.deleteError"));
    }
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <svg className="w-12 h-12 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-sm text-heading font-body-semibold mb-1">{t("categories.emptyTitle")}</p>
          <p className="text-xs text-muted mb-4 max-w-xs text-center">{t("categories.emptyDescription")}</p>
          <Button size="sm" onClick={openCreate}>{t("categories.new")}</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-body-bold text-heading">
              {t("categories.title")} ({categories.length})
            </h2>
            <Button size="sm" onClick={openCreate}>{t("categories.new")}</Button>
          </div>
          <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-card bg-surface-hover">
                  <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase w-10" />
                  <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("categories.name")}</th>
                  <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase hidden md:table-cell">{t("categories.slug")}</th>
                  <th className="px-2 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-border-row last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: COLOR_MAP[cat.color] || cat.color }} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-body-medium text-heading">{cat.name}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-sm text-muted">{cat.slug}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <ActionMenu items={[
                        { label: t("common.edit"), onClick: () => openEdit(cat) },
                        { label: t("common.delete"), onClick: () => setDeleteId(cat.id), danger: true },
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
            {sheet.mode === "create" ? t("categories.new") : t("categories.editTitle")}
          </h2>
          <form onSubmit={handleSubmit}>
            <FormInput label={t("categories.name")} required>
              <Input
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (!slugManual) setSlug(slugify(v));
                }}
                placeholder={t("categories.namePlaceholder")}
                autoFocus
              />
            </FormInput>

            <FormInput label={t("categories.slug")}>
              <Input
                value={slug}
                onChange={(v) => { setSlug(v); setSlugManual(true); }}
                placeholder="auto-generated"
              />
              <p className="text-exs text-muted mt-1">{t("categories.slugHint")}</p>
            </FormInput>

            <FormInput label={t("categories.color")}>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                      color === c.value ? "border-heading scale-110" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: COLOR_MAP[c.value] }}
                    title={c.name}
                  />
                ))}
              </div>
            </FormInput>

            <div className="flex justify-end gap-3">
              <Button type="button" size="sm" color="light" onClick={closeSheet}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={submitting} disabled={!name.trim() || !slug.trim()}>
                {sheet.mode === "create" ? t("categories.new") : t("common.save")}
              </Button>
            </div>
          </form>

          {sheet.mode === "edit" && (
            <div className="mt-6 pt-6 border-t border-border-card">
              <Button size="xs" color="danger" onClick={() => { closeSheet(); setDeleteId(sheet.category.id); }}>
                {t("common.delete")}
              </Button>
            </div>
          )}
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("common.delete")}
          message={t("categories.deleteMessage")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
