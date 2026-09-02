import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  WebhookDto,
  WEBHOOK_EVENTS,
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from "../services/webhook.service";

interface Props {
  slug: string;
}

export default function WebhookSettings({ slug }: Props) {
  const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState<WebhookDto[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [editWebhook, setEditWebhook] = useState<WebhookDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);
  const isDirtyRef = useRef(false);

  const handleSheetClose = () => {
    if (isDirtyRef.current) {
      setShowDiscard(true);
    } else {
      setShowSheet(false);
      setEditWebhook(null);
    }
  };

  useEffect(() => {
    listWebhooks(slug).then(setWebhooks).catch(() => {});
  }, [slug]);

  const handleSaved = async () => {
    const updated = await listWebhooks(slug);
    setWebhooks(updated);
    setShowSheet(false);
    setEditWebhook(null);
  };

  const handleToggle = async (webhook: WebhookDto) => {
    try {
      await updateWebhook(slug, webhook.id, { isActive: !webhook.isActive });
      setWebhooks((prev) =>
        prev.map((w) => w.id === webhook.id ? { ...w, isActive: !w.isActive } : w),
      );
    } catch {
      toast.error(t("webhooks.updateError"));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteWebhook(slug, deleteId);
      setWebhooks((prev) => prev.filter((w) => w.id !== deleteId));
      setDeleteId(null);
      toast.success(t("webhooks.deleted"));
    } catch {
      toast.error(t("webhooks.deleteError"));
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="xs" color="light" onClick={() => setShowSheet(true)}>
          {t("webhooks.add")}
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <p className="text-xs text-muted">{t("webhooks.empty")}</p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((w) => (
            <div key={w.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border-card bg-surface">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${w.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-body-medium text-body break-all">{w.url}</p>
                  <p className="text-exs text-muted">
                    {w.events.length} {w.events.length === 1 ? t("webhooks.event") : t("webhooks.events")}
                    {" · "}
                    {w.isActive ? t("webhooks.active") : t("webhooks.inactive")}
                  </p>
                </div>
              </div>
              <ActionMenu
                items={[
                  {
                    label: w.isActive ? t("webhooks.disable") : t("webhooks.enable"),
                    onClick: () => handleToggle(w),
                  },
                  {
                    label: t("common.edit"),
                    onClick: () => { setEditWebhook(w); setShowSheet(true); },
                  },
                  {
                    label: t("common.delete"),
                    onClick: () => setDeleteId(w.id),
                    danger: true,
                  },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      {showSheet && (
        <Sheet size="sm" onClose={handleSheetClose}>
          <WebhookForm slug={slug} webhook={editWebhook} onSaved={handleSaved} onDirtyChange={(d) => { isDirtyRef.current = d; }} />
        </Sheet>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("webhooks.deleteTitle")}
          message={t("webhooks.deleteMessage")}
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
          onConfirm={() => { setShowDiscard(false); setShowSheet(false); setEditWebhook(null); }}
          onCancel={() => setShowDiscard(false)}
        />
      )}
    </div>
  );
}

function WebhookForm({ slug, webhook, onSaved, onDirtyChange }: { slug: string; webhook: WebhookDto | null; onSaved: () => void; onDirtyChange: (dirty: boolean) => void }) {
  const isEdit = !!webhook;
  const { t } = useTranslation();
  const [url, setUrl] = useState(webhook?.url ?? "");
  const [events, setEvents] = useState<string[]>(webhook?.events ?? [...WEBHOOK_EVENTS]);
  const [saving, setSaving] = useState(false);

  const originalUrl = webhook?.url ?? "";
  const originalEvents = webhook?.events ?? [...WEBHOOK_EVENTS];
  const isDirty = url !== originalUrl || JSON.stringify([...events].sort()) !== JSON.stringify([...originalEvents].sort());

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty]);

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || events.length === 0) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateWebhook(slug, webhook!.id, { url: url.trim(), events });
      } else {
        await createWebhook(slug, { url: url.trim(), events });
      }
      toast.success(isEdit ? t("webhooks.updated") : t("webhooks.created"));
      onSaved();
    } catch {
      toast.error(t("webhooks.createError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-body-bold text-heading mb-1">
        {isEdit ? t("webhooks.editTitle") : t("webhooks.addTitle")}
      </h2>
      <p className="text-sm text-muted mb-6">{t("webhooks.formDescription")}</p>

      <form onSubmit={handleSave}>
        <FormInput label={t("webhooks.url")} required>
          <Input placeholder="https://example.com/webhook" value={url} onChange={setUrl} />
        </FormInput>

        <div className="mt-4">
          <p className="text-xs font-body-semibold text-heading mb-2">{t("webhooks.selectEvents")}</p>
          <div className="space-y-1.5">
            {WEBHOOK_EVENTS.map((event) => (
              <label key={event} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={events.includes(event)}
                  onChange={() => toggleEvent(event)}
                  className="rounded border-gray-300 text-primary focus:ring-primary/50"
                />
                <span className="text-xs text-body">{event}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Button size="sm" type="submit" full loading={saving} disabled={!url.trim() || events.length === 0}>
            {isEdit ? t("webhooks.save") : t("webhooks.add")}
          </Button>
        </div>
      </form>
    </div>
  );
}
