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
  const [showSheet, setShowSheet] = useState(false);
  const [editCategory, setEditCategory] = useState<TicketCategoryDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("blue");
  const [slugManual, setSlugManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;
    listCategories(workspaceSlug).then(setCategories).catch(() => {}).finally(() => setLoading(false));
  }, [workspaceSlug]);

  const openCreate = () => {
    setEditCategory(null);
    setName("");
    setSlug("");
    setColor("blue");
    setSlugManual(false);
    setShowSheet(true);
  };

  const openEdit = (cat: TicketCategoryDto) => {
    setEditCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setColor(cat.color);
    setSlugManual(true);
    setShowSheet(true);
  };

  const handleSave = async () => {
    if (!workspaceSlug || !name.trim() || !slug.trim()) return;
    setSubmitting(true);
    try {
      if (editCategory) {
        await updateCategory(workspaceSlug, editCategory.id, { name: name.trim(), slug: slug.trim(), color });
        toast.success(t("categories.updated"));
      } else {
        await createCategory(workspaceSlug, { name: name.trim(), slug: slug.trim(), color });
        toast.success(t("categories.created"));
      }
      const updated = await listCategories(workspaceSlug);
      setCategories(updated);
      setShowSheet(false);
    } catch {
      toast.error(editCategory ? t("categories.updated") : t("categories.created"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    try {
      await deleteCategory(workspaceSlug, deleteId);
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      toast.success(t("categories.deleted"));
    } catch {
      toast.error(t("categories.deleted"));
    }
  };

  if (loading) return null;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="xs" color="light" onClick={openCreate}>
          {t("categories.new")}
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-xs text-muted">{t("categories.empty")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => openEdit(cat)}
              className="flex items-center gap-2 bg-surface border border-border-card rounded-lg px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors"
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[cat.color] || cat.color }} />
              <span className="text-sm font-body-medium text-body">{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {showSheet && (
        <Sheet onClose={() => setShowSheet(false)}>
          <div className="p-6">
            <h2 className="text-lg font-body-bold text-heading mb-1">
              {editCategory ? t("categories.editTitle") : t("categories.new")}
            </h2>
            <p className="text-sm text-muted mb-6">
              {editCategory ? t("categories.editTitle") : t("categories.new")}
            </p>

            <FormInput label={t("categories.name")} required>
              <Input
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (!slugManual) setSlug(slugify(v));
                }}
                placeholder={t("categories.namePlaceholder")}
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

            {editCategory && (
              <div className="mt-4">
                <Button size="xs" color="danger" onClick={() => { setShowSheet(false); setDeleteId(editCategory.id); }}>
                  {t("tickets.delete")}
                </Button>
              </div>
            )}

            <div className="mt-6">
              <Button size="sm" full onClick={handleSave} loading={submitting} disabled={!name.trim() || !slug.trim()}>
                {editCategory ? t("settings.save") : t("categories.new")}
              </Button>
            </div>
          </div>
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("categories.deleteTitle")}
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
