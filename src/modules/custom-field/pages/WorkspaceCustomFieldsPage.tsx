import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { TranslationKey } from "@modules/app/i18n/translations";
import { CustomFieldDefinition } from "../domain/custom-field-types";
import {
  listCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
} from "../services/custom-field.service";

const FIELD_TYPES = ["text", "number", "select", "multi-select", "date", "checkbox"] as const;

const TYPE_LABEL_KEYS: Record<string, TranslationKey> = {
  text: "customFields.typeText",
  number: "customFields.typeNumber",
  select: "customFields.typeSelect",
  "multi-select": "customFields.typeMultiSelect",
  date: "customFields.typeDate",
  checkbox: "customFields.typeCheckbox",
};

const TYPE_COLORS: Record<string, "blue" | "green" | "yellow" | "red" | "gray" | "primary"> = {
  text: "gray",
  number: "blue",
  select: "primary",
  "multi-select": "primary",
  date: "yellow",
  checkbox: "green",
};

export default function WorkspaceCustomFieldsPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("text");
  const [optionsText, setOptionsText] = useState("");
  const [required, setRequired] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalOptionsText, setOriginalOptionsText] = useState("");
  const [originalRequired, setOriginalRequired] = useState(false);

  const isDirty = name !== originalName || optionsText !== originalOptionsText || required !== originalRequired;

  const handleClose = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      setShowSheet(false);
    }
  };

  const needsOptions = (t: string) => t === "select" || t === "multi-select";

  const fetchFields = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listCustomFields(workspaceSlug)
      .then(setFields)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFields();
  }, [workspaceSlug]);

  const openCreate = () => {
    setEditingId(null);
    setEditingType(null);
    setName("");
    setType("text");
    setOptionsText("");
    setRequired(false);
    setOriginalName("");
    setOriginalOptionsText("");
    setOriginalRequired(false);
    setShowSheet(true);
  };

  const openEdit = (f: CustomFieldDefinition) => {
    setEditingId(f.id);
    setEditingType(f.type);
    setName(f.name);
    setType(f.type);
    setOptionsText(f.options?.join(", ") ?? "");
    setRequired(f.required);
    setOriginalName(f.name);
    setOriginalOptionsText(f.options?.join(", ") ?? "");
    setOriginalRequired(f.required);
    setShowSheet(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setSaving(true);
    try {
      const options = needsOptions(type)
        ? optionsText.split(",").map((o) => o.trim()).filter(Boolean)
        : undefined;

      if (editingId) {
        await updateCustomField(workspaceSlug, editingId, { name, options, required });
        toast.success(t("customFields.updated"));
      } else {
        await createCustomField(workspaceSlug, { name, type, options, required });
        toast.success(t("customFields.created"));
      }
      setShowSheet(false);
      fetchFields();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    await deleteCustomField(workspaceSlug, deleteId);
    setDeleteId(null);
    fetchFields();
    toast.success(t("customFields.deleted"));
  };

  const currentNeedsOptions = editingId ? needsOptions(editingType ?? type) : needsOptions(type);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">
          {t("customFields.title")}
        </h2>
        {can(P.CUSTOM_FIELD_MANAGE) && (
          <Button size="sm" onClick={openCreate}>
            {t("customFields.new")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : fields.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          {t("customFields.empty")}
        </p>
      ) : (
        <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">
                  {t("customFields.nameLabel")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">
                  {t("customFields.typeLabel")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">
                  {t("customFields.optionsLabel")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">
                  {t("customFields.required")}
                </th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.id} className="border-b border-border-row">
                  <td className="px-4 py-3">
                    <span className="text-sm font-body-semibold text-heading">{f.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={TYPE_LABEL_KEYS[f.type] ? t(TYPE_LABEL_KEYS[f.type]) : f.type}
                      color={TYPE_COLORS[f.type] ?? "gray"}
                      size="xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-subtle">
                      {f.options?.join(", ") ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-subtle">
                      {f.required ? t("common.yes") : t("common.no")}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    {can(P.CUSTOM_FIELD_MANAGE) && (
                      <ActionMenu
                        items={[
                          { label: t("customFields.edit"), onClick: () => openEdit(f) },
                          { label: t("common.delete"), onClick: () => setDeleteId(f.id), danger: true },
                        ]}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("common.delete")}
          message={t("ticketDetail.deleteMessage")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showDiscard && (
        <ConfirmModal
          title={t("discard.title")}
          message={t("discard.message")}
          confirmLabel={t("discard.confirm")}
          danger
          onConfirm={() => { setShowDiscard(false); setShowSheet(false); }}
          onCancel={() => setShowDiscard(false)}
        />
      )}

      {showSheet && (
        <Sheet onClose={handleClose}>
          <h2 className="text-lg font-body-bold text-heading mb-6">
            {editingId ? t("customFields.edit") : t("customFields.new")}
          </h2>
          <form onSubmit={handleSubmit}>
            <FormInput label={t("customFields.nameLabel")} required>
              <Input value={name} onChange={setName} placeholder={t("customFields.namePlaceholder")} autoFocus />
            </FormInput>
            {!editingId && (
              <FormInput label={t("customFields.typeLabel")} required>
                <Select
                  options={[...FIELD_TYPES]}
                  label={(v) => TYPE_LABEL_KEYS[v] ? t(TYPE_LABEL_KEYS[v]) : v}
                  value={(v) => v === type}
                  onChange={setType}
                  placeholder={t("customFields.typeLabel")}
                />
              </FormInput>
            )}
            {currentNeedsOptions && (
              <FormInput label={t("customFields.optionsLabel")}>
                <Input
                  value={optionsText}
                  onChange={setOptionsText}
                  placeholder={t("customFields.optionsPlaceholder")}
                />
              </FormInput>
            )}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <span className="text-sm text-body">{t("customFields.required")}</span>
            </label>
            <div className="flex justify-end gap-3">
              <Button size="sm" color="light" onClick={handleClose}>
                {t("customFields.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={saving}>
                {editingId ? t("customFields.save") : t("customFields.create")}
              </Button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}
