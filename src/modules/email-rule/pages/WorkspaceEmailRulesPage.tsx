import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  EmailRule,
  RuleCondition,
  RuleAction,
  listEmailRules,
  createEmailRule,
  updateEmailRule,
  deleteEmailRule,
  reorderEmailRules,
} from "../services/email-rule.service";

const CONDITION_FIELDS = [
  { value: "from", labelKey: "emailRules.fieldFrom" },
  { value: "subject", labelKey: "emailRules.fieldSubject" },
  { value: "to", labelKey: "emailRules.fieldTo" },
] as const;

const OPERATORS = [
  { value: "contains", labelKey: "emailRules.opContains" },
  { value: "equals", labelKey: "emailRules.opEquals" },
  { value: "starts-with", labelKey: "emailRules.opStartsWith" },
  { value: "ends-with", labelKey: "emailRules.opEndsWith" },
] as const;

const ACTION_TYPES = [
  { value: "reject", labelKey: "emailRules.actionReject" },
  { value: "set-department", labelKey: "emailRules.actionSetDepartment" },
  { value: "set-priority", labelKey: "emailRules.actionSetPriority" },
  { value: "set-category", labelKey: "emailRules.actionSetCategory" },
  { value: "add-tags", labelKey: "emailRules.actionAddTags" },
  { value: "assign-to", labelKey: "emailRules.actionAssignTo" },
  { value: "set-organization", labelKey: "emailRules.actionSetOrganization" },
] as const;

const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const CATEGORIES = ["bug", "issue", "task"] as const;

function SortableRow({ rule, t, tEnum, onEdit, onToggle, onDelete }: {
  rule: EmailRule;
  t: (key: any) => string;
  tEnum: (ns: string, key: string) => string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const conditionSummary = rule.conditions.map((c) =>
    `${t(`emailRules.field${c.field[0].toUpperCase()}${c.field.slice(1)}`)} ${t(`emailRules.op${c.operator.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("")}`)} "${c.value}"`
  ).join(" & ");

  const actionSummary = rule.actions.map((a) => {
    const label = t(`emailRules.action${a.type.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("")}`);
    if (a.type === "reject") return label;
    if (a.type === "set-priority") return `${label}: ${tEnum("priority", a.value ?? "")}`;
    if (a.type === "set-category") return `${label}: ${tEnum("category", a.value ?? "")}`;
    return a.value ? `${label}: ${a.value}` : label;
  }).join(", ");

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border-row">
      <td className="px-2 py-3 w-8 cursor-grab" {...attributes} {...listeners}>
        <span className="text-muted">⠿</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-body-semibold text-heading">{rule.name}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted">{conditionSummary}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted">{actionSummary}</span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          label={rule.isActive ? t("emailRules.active") : t("emailRules.inactive")}
          color={rule.isActive ? "green" : "gray"}
          size="xs"
        />
      </td>
      <td className="px-2 py-3">
        <ActionMenu items={[
          { label: t("ticketDetail.edit"), onClick: onEdit },
          { label: rule.isActive ? t("emailRules.disable") : t("emailRules.enable"), onClick: onToggle },
          { label: t("members.remove"), onClick: onDelete, danger: true },
        ]} />
      </td>
    </tr>
  );
}

export default function WorkspaceEmailRulesPage() {
  const { workspaceSlug } = useParams();
  const { t, tEnum } = useTranslation();
  const [rules, setRules] = useState<EmailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRule, setEditingRule] = useState<EmailRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [conditions, setConditions] = useState<RuleCondition[]>([{ field: "from", operator: "contains", value: "" }]);
  const [actions, setActions] = useState<RuleAction[]>([{ type: "reject" }]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const fetchRules = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listEmailRules(workspaceSlug).then(setRules).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, [workspaceSlug]);

  const resetForm = () => {
    setName("");
    setConditions([{ field: "from", operator: "contains", value: "" }]);
    setActions([{ type: "reject" }]);
  };

  const openCreate = () => {
    resetForm();
    setEditingRule(null);
    setShowCreate(true);
  };

  const openEdit = (rule: EmailRule) => {
    setName(rule.name);
    setConditions([...rule.conditions]);
    setActions([...rule.actions]);
    setEditingRule(rule);
    setShowCreate(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setSaving(true);
    try {
      if (editingRule) {
        await updateEmailRule(workspaceSlug, editingRule.id, { name, conditions, actions });
        toast.success(t("emailRules.updated"));
      } else {
        await createEmailRule(workspaceSlug, { name, conditions, actions });
        toast.success(t("emailRules.created"));
      }
      setShowCreate(false);
      resetForm();
      setEditingRule(null);
      fetchRules();
    } catch {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: EmailRule) => {
    if (!workspaceSlug) return;
    await updateEmailRule(workspaceSlug, rule.id, { isActive: !rule.isActive });
    fetchRules();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    await deleteEmailRule(workspaceSlug, deleteId);
    setDeleteId(null);
    fetchRules();
    toast.success(t("emailRules.deleted"));
  };

  const handleDragEnd = async (event: any) => {
    if (!workspaceSlug) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rules.findIndex((r) => r.id === active.id);
    const newIndex = rules.findIndex((r) => r.id === over.id);
    const reordered = [...rules];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setRules(reordered);
    await reorderEmailRules(workspaceSlug, reordered.map((r) => r.id));
  };

  const updateCondition = (index: number, patch: Partial<RuleCondition>) => {
    setConditions((prev) => prev.map((c, i) => i === index ? { ...c, ...patch } : c));
  };

  const updateAction = (index: number, patch: Partial<RuleAction>) => {
    setActions((prev) => prev.map((a, i) => i === index ? { ...a, ...patch } : a));
  };

  const needsValue = (type: string) => type !== "reject";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("emailRules.title")}</h2>
        <Button size="sm" onClick={openCreate}>{t("emailRules.new")}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner width={24} /></div>
      ) : rules.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("emailRules.empty")}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-card bg-surface-hover">
                  <th className="px-2 py-3 w-8" />
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("emailRules.name")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("emailRules.conditions")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">{t("emailRules.actions")}</th>
                  <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase w-[80px]">{t("admin.col.status")}</th>
                  <th className="px-2 py-3 w-10" />
                </tr>
              </thead>
              <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {rules.map((rule) => (
                    <SortableRow
                      key={rule.id}
                      rule={rule}
                      t={t}
                      tEnum={tEnum}
                      onEdit={() => openEdit(rule)}
                      onToggle={() => handleToggle(rule)}
                      onDelete={() => setDeleteId(rule.id)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      )}

      {showCreate && (
        <Sheet onClose={() => { setShowCreate(false); setEditingRule(null); }}>
          <h3 className="text-lg font-body-bold text-heading mb-4">
            {editingRule ? t("emailRules.edit") : t("emailRules.new")}
          </h3>
          <form onSubmit={handleSave}>
            <FormInput label={t("emailRules.name")} className="mb-4">
              <Input value={name} onChange={setName} required />
            </FormInput>

            {/* Conditions */}
            <p className="text-xs font-body-semibold text-subtle uppercase mb-2">{t("emailRules.conditions")}</p>
            {conditions.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <FormInput label={i === 0 ? t("emailRules.field") : undefined} className="flex-1">
                  <select
                    value={c.field}
                    onChange={(e) => updateCondition(i, { field: e.target.value as RuleCondition["field"] })}
                    className="w-full text-sm bg-surface border border-border-card rounded px-2 py-1.5 text-body"
                  >
                    {CONDITION_FIELDS.map((f) => <option key={f.value} value={f.value}>{t(f.labelKey)}</option>)}
                  </select>
                </FormInput>
                <FormInput label={i === 0 ? t("emailRules.operator") : undefined} className="flex-1">
                  <select
                    value={c.operator}
                    onChange={(e) => updateCondition(i, { operator: e.target.value as RuleCondition["operator"] })}
                    className="w-full text-sm bg-surface border border-border-card rounded px-2 py-1.5 text-body"
                  >
                    {OPERATORS.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
                  </select>
                </FormInput>
                <FormInput label={i === 0 ? t("emailRules.value") : undefined} className="flex-[2]">
                  <Input value={c.value} onChange={(v) => updateCondition(i, { value: v })} required />
                </FormInput>
                {conditions.length > 1 && (
                  <button type="button" onClick={() => setConditions((p) => p.filter((_, j) => j !== i))} className="text-red-500 text-sm pb-1 cursor-pointer">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setConditions((p) => [...p, { field: "from", operator: "contains", value: "" }])} className="text-xs text-primary cursor-pointer mb-4">
              + {t("emailRules.addCondition")}
            </button>

            {/* Actions */}
            <p className="text-xs font-body-semibold text-subtle uppercase mb-2">{t("emailRules.actions")}</p>
            {actions.map((a, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <FormInput label={i === 0 ? t("emailRules.actionType") : undefined} className="flex-1">
                  <select
                    value={a.type}
                    onChange={(e) => updateAction(i, { type: e.target.value as RuleAction["type"], value: undefined })}
                    className="w-full text-sm bg-surface border border-border-card rounded px-2 py-1.5 text-body"
                  >
                    {ACTION_TYPES.map((at) => <option key={at.value} value={at.value}>{t(at.labelKey)}</option>)}
                  </select>
                </FormInput>
                {needsValue(a.type) && (
                  <FormInput label={i === 0 ? t("emailRules.value") : undefined} className="flex-[2]">
                    {a.type === "set-priority" ? (
                      <select
                        value={a.value ?? ""}
                        onChange={(e) => updateAction(i, { value: e.target.value })}
                        className="w-full text-sm bg-surface border border-border-card rounded px-2 py-1.5 text-body"
                      >
                        <option value="">—</option>
                        {PRIORITIES.map((p) => <option key={p} value={p}>{tEnum("priority", p)}</option>)}
                      </select>
                    ) : a.type === "set-category" ? (
                      <select
                        value={a.value ?? ""}
                        onChange={(e) => updateAction(i, { value: e.target.value })}
                        className="w-full text-sm bg-surface border border-border-card rounded px-2 py-1.5 text-body"
                      >
                        <option value="">—</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{tEnum("category", c)}</option>)}
                      </select>
                    ) : (
                      <Input value={a.value ?? ""} onChange={(v) => updateAction(i, { value: v })} />
                    )}
                  </FormInput>
                )}
                {actions.length > 1 && (
                  <button type="button" onClick={() => setActions((p) => p.filter((_, j) => j !== i))} className="text-red-500 text-sm pb-1 cursor-pointer">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setActions((p) => [...p, { type: "reject" }])} className="text-xs text-primary cursor-pointer mb-4">
              + {t("emailRules.addAction")}
            </button>

            <div className="flex gap-2 justify-end mt-4">
              <Button type="button" size="sm" color="light" onClick={() => { setShowCreate(false); setEditingRule(null); }}>{t("admin.cancel")}</Button>
              <Button type="submit" size="sm" loading={saving}>{t("members.save")}</Button>
            </div>
          </form>
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("emailRules.deleteTitle")}
          message={t("emailRules.deleteMessage")}
          confirmLabel={t("members.remove")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
