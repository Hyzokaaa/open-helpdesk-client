import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import RichTextEditor, { RichTextEditorRef } from "../components/RichTextEditor";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  KbCategory, KbArticleListItem, KbArticle,
  listCategories, createCategory, updateCategory, deleteCategory,
  listArticles, getArticle, createArticle, updateArticle, deleteArticle,
} from "../services/kb.service";

export default function WorkspaceKbPage() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [articles, setArticles] = useState<KbArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editCategory, setEditCategory] = useState<KbCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Article sheet
  const [showArticleSheet, setShowArticleSheet] = useState(false);
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleStatus, setArticleStatus] = useState("draft");
  const [articleCategoryId, setArticleCategoryId] = useState("");
  const [savingArticle, setSavingArticle] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  const fetchData = async () => {
    if (!workspaceSlug) return;
    try {
      const [cats, arts] = await Promise.all([listCategories(workspaceSlug), listArticles(workspaceSlug)]);
      setCategories(cats);
      setArticles(arts);
      if (!selectedCategoryId && cats.length > 0) setSelectedCategoryId(cats[0].id);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [workspaceSlug]);

  const filteredArticles = selectedCategoryId
    ? articles.filter((a) => a.categoryId === selectedCategoryId)
    : articles;

  // Category handlers
  const handleSaveCategory = async () => {
    if (!workspaceSlug || !categoryName.trim()) return;
    setSavingCategory(true);
    try {
      if (editCategory) {
        await updateCategory(workspaceSlug, editCategory.id, { name: categoryName.trim() });
      } else {
        await createCategory(workspaceSlug, { name: categoryName.trim() });
      }
      await fetchData();
      setShowCategoryForm(false);
      setEditCategory(null);
      setCategoryName("");
      toast.success(editCategory ? t("kb.categoryUpdated") : t("kb.categoryCreated"));
    } catch { toast.error(t("kb.categoryError")); }
    finally { setSavingCategory(false); }
  };

  const handleDeleteCategory = async () => {
    if (!workspaceSlug || !deleteCategoryId) return;
    try {
      await deleteCategory(workspaceSlug, deleteCategoryId);
      if (selectedCategoryId === deleteCategoryId) setSelectedCategoryId(null);
      await fetchData();
      toast.success(t("kb.categoryDeleted"));
    } catch { toast.error(t("kb.categoryError")); }
    finally { setDeleteCategoryId(null); }
  };

  // Article handlers
  const openNewArticle = () => {
    setEditArticleId(null);
    setArticleTitle("");
    setArticleContent("");
    setArticleStatus("draft");
    setArticleCategoryId(selectedCategoryId || categories[0]?.id || "");
    setShowArticleSheet(true);
  };

  const openEditArticle = async (id: string) => {
    if (!workspaceSlug) return;
    try {
      const article = await getArticle(workspaceSlug, id);
      setEditArticleId(id);
      setArticleTitle(article.title);
      setArticleContent(article.content);
      setArticleStatus(article.status);
      setArticleCategoryId(article.categoryId);
      setShowArticleSheet(true);
    } catch { toast.error(t("kb.loadError")); }
  };

  const handleSaveArticle = async () => {
    if (!workspaceSlug || !articleTitle.trim() || !articleCategoryId) return;
    const content = editorRef.current?.getHTML() || "";
    setSavingArticle(true);
    try {
      if (editArticleId) {
        await updateArticle(workspaceSlug, editArticleId, {
          title: articleTitle.trim(), content, status: articleStatus, categoryId: articleCategoryId,
        });
      } else {
        await createArticle(workspaceSlug, {
          title: articleTitle.trim(), content, categoryId: articleCategoryId, status: articleStatus,
        });
      }
      await fetchData();
      setShowArticleSheet(false);
      toast.success(editArticleId ? t("kb.articleUpdated") : t("kb.articleCreated"));
    } catch { toast.error(t("kb.articleError")); }
    finally { setSavingArticle(false); }
  };

  const handleDeleteArticle = async () => {
    if (!workspaceSlug || !deleteArticleId) return;
    try {
      await deleteArticle(workspaceSlug, deleteArticleId);
      await fetchData();
      toast.success(t("kb.articleDeleted"));
    } catch { toast.error(t("kb.articleError")); }
    finally { setDeleteArticleId(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-body-bold text-heading">{t("kb.title")}</h2>
        <div className="flex gap-2">
          <Button size="xs" color="light" onClick={() => { setEditCategory(null); setCategoryName(""); setShowCategoryForm(true); }}>
            {t("kb.addCategory")}
          </Button>
          <Button size="xs" color="primary" onClick={openNewArticle} disabled={categories.length === 0}>
            {t("kb.addArticle")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted mb-6">{t("kb.subtitle")}</p>

      {categories.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("kb.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category sidebar */}
          <div>
            <p className="text-xs text-subtle font-body-medium mb-2 px-3">{t("kb.categories")}</p>
            <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedCategoryId === cat.id ? "bg-surface-active text-heading" : "text-muted hover:bg-surface-hover"
                }`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <span className="text-sm font-body-medium truncate">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-exs text-subtle">{articles.filter((a) => a.categoryId === cat.id).length}</span>
                  <ActionMenu items={[
                    { label: t("tickets.edit"), onClick: () => { setEditCategory(cat); setCategoryName(cat.name); setShowCategoryForm(true); } },
                    { label: t("tickets.delete"), onClick: () => setDeleteCategoryId(cat.id), danger: true },
                  ]} />
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Articles list */}
          <div className="lg:col-span-3">
            <p className="text-xs text-subtle font-body-medium mb-2">{t("kb.articles")}</p>
            {filteredArticles.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">{t("kb.noArticles")}</p>
            ) : (
              <div className="space-y-2">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge
                        label={article.status === "published" ? t("kb.published") : t("kb.draft")}
                        color={article.status === "published" ? "green" : "gray"}
                        size="xs"
                      />
                      <span className="text-sm text-body font-body-medium truncate">{article.title}</span>
                    </div>
                    <ActionMenu items={[
                      { label: t("tickets.edit"), onClick: () => openEditArticle(article.id) },
                      { label: t("tickets.delete"), onClick: () => setDeleteArticleId(article.id), danger: true },
                    ]} />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category form modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCategoryForm(false)} />
          <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-body-bold text-heading mb-4">
              {editCategory ? t("kb.editCategory") : t("kb.addCategory")}
            </h3>
            <FormInput label={t("kb.categoryName")}>
              <Input value={categoryName} onChange={setCategoryName} size="sm" placeholder={t("kb.categoryNamePlaceholder")} />
            </FormInput>
            <div className="flex gap-2 mt-4 justify-end">
              <Button size="sm" color="light" onClick={() => setShowCategoryForm(false)}>{t("ticketDetail.cancel")}</Button>
              <Button size="sm" color="primary" onClick={handleSaveCategory} loading={savingCategory} disabled={!categoryName.trim()}>
                {t("settings.save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Article editor sheet */}
      {showArticleSheet && (
        <Sheet onClose={() => setShowArticleSheet(false)}>
          <div className="p-6 max-w-3xl">
            <h2 className="text-lg font-body-bold text-heading mb-6">
              {editArticleId ? t("kb.editArticle") : t("kb.addArticle")}
            </h2>

            <div className="space-y-4">
              <FormInput label={t("kb.articleTitle")}>
                <Input value={articleTitle} onChange={setArticleTitle} size="sm" placeholder={t("kb.articleTitlePlaceholder")} />
              </FormInput>

              <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("kb.category")}>
                  <Select
                    options={categories}
                    label={(c) => c.name}
                    value={(c) => c.id === articleCategoryId}
                    onChange={(c) => setArticleCategoryId(c.id)}
                    placeholder={t("kb.selectCategory")}
                  />
                </FormInput>
                <FormInput label={t("kb.status")}>
                  <Select
                    options={[{ id: "draft", label: t("kb.draft") }, { id: "published", label: t("kb.published") }]}
                    label={(s) => s.label}
                    value={(s) => s.id === articleStatus}
                    onChange={(s) => setArticleStatus(s.id)}
                  />
                </FormInput>
              </div>

              <FormInput label={t("kb.content")}>
                <RichTextEditor ref={editorRef} initialValue={articleContent} placeholder={t("kb.contentPlaceholder")} />
              </FormInput>

              <div className="flex gap-2 justify-end">
                <Button size="sm" color="light" onClick={() => setShowArticleSheet(false)}>{t("ticketDetail.cancel")}</Button>
                <Button size="sm" color="primary" onClick={handleSaveArticle} loading={savingArticle} disabled={!articleTitle.trim() || !articleCategoryId}>
                  {t("settings.save")}
                </Button>
              </div>
            </div>
          </div>
        </Sheet>
      )}

      {/* Delete modals */}
      {deleteCategoryId && (
        <ConfirmModal
          title={t("kb.deleteCategoryTitle")}
          message={t("kb.deleteCategoryMessage")}
          confirmLabel={t("tickets.delete")}
          danger
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeleteCategoryId(null)}
        />
      )}
      {deleteArticleId && (
        <ConfirmModal
          title={t("kb.deleteArticleTitle")}
          message={t("kb.deleteArticleMessage")}
          confirmLabel={t("tickets.delete")}
          danger
          onConfirm={handleDeleteArticle}
          onCancel={() => setDeleteArticleId(null)}
        />
      )}
    </div>
  );
}
