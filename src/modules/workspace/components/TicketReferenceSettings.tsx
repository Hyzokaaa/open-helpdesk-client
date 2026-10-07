import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import {
  TicketReferenceSettings as Settings,
  convertTicketReferences,
  getTicketReference,
  updateTicketReference,
} from "../services/workspace.service";
import DeleteWorkspaceModal from "./DeleteWorkspaceModal";

interface Props {
  slug: string;
  workspaceName: string;
}

/**
 * How the workspace shows its ticket references: sequential (TK-000042) or random (TK-7QX4M2K),
 * and with which prefix. Each ticket keeps the reference it was created with, so a change applies
 * to new tickets only; converting the existing ones is a separate action, confirmed with the
 * workspace name, because their old references stop leading to them.
 */
export default function TicketReferenceSettings({ slug, workspaceName }: Props) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<Settings | null>(null);
  const [style, setStyle] = useState<"sequential" | "random">("sequential");
  const [prefix, setPrefix] = useState("TK");
  const [saving, setSaving] = useState(false);
  const [confirmingConvert, setConfirmingConvert] = useState(false);
  const [converting, setConverting] = useState(false);

  const load = (s: Settings) => {
    setCurrent(s);
    setStyle(s.style === "random" ? "random" : "sequential");
    setPrefix(s.prefix);
  };

  useEffect(() => {
    getTicketReference(slug).then(load).catch(() => toast.error(t("ticketReference.loadError")));
  }, [slug]);

  if (!current) return null;

  const changed = style !== current.style || prefix.trim().toUpperCase() !== current.prefix;

  const save = async () => {
    setSaving(true);
    try {
      load(await updateTicketReference(slug, { style, prefix }));
      toast.success(t("ticketReference.saved"));
    } catch (err) {
      const e = err as HttpResponseError;
      if (!e?.handled) toast.error(e?.message || t("ticketReference.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const convert = async (typedName: string) => {
    setConverting(true);
    try {
      const { converted } = await convertTicketReferences(slug, typedName);
      toast.success(t("ticketReference.converted").replace("{count}", String(converted)));
      setConfirmingConvert(false);
    } catch (err) {
      const e = err as HttpResponseError;
      if (!e?.handled) toast.error(e?.message || t("ticketReference.convertError"));
    } finally {
      setConverting(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-muted mb-3">{t("ticketReference.intro")}</p>
      <Toggle
        left={t("ticketReference.sequential")}
        right={t("ticketReference.random")}
        active={style === "random" ? "right" : "left"}
        onChange={(value) => setStyle(value === "right" ? "random" : "sequential")}
      />
      <p className="text-exs text-muted mt-2">
        {t(style === "random" ? "ticketReference.randomHint" : "ticketReference.sequentialHint")}
      </p>

      <div className="mt-4 max-w-xs">
        <label className="block text-xs text-subtle font-body-medium mb-1">{t("ticketReference.prefix")}</label>
        <Input value={prefix} onChange={(v) => setPrefix(v.toUpperCase())} />
        <p className="text-exs text-muted mt-1">{t("ticketReference.prefixHint")}</p>
      </div>

      <p className="text-sm text-body mt-4">
        {t("ticketReference.example")} <span className="font-mono font-body-semibold">{current.example}</span>
      </p>
      {changed && <p className="text-exs text-amber-700 dark:text-amber-300 mt-1">{t("ticketReference.changeNote")}</p>}

      <div className="flex justify-end mt-3">
        <Button size="sm" loading={saving} disabled={!changed} onClick={save}>{t("ticketReference.save")}</Button>
      </div>

      <div className="mt-6 pt-4 border-t border-default">
        <p className="text-sm font-body-semibold text-heading">{t("ticketReference.convertTitle")}</p>
        <p className="text-xs text-muted mt-1">{t("ticketReference.convertHint").replace("{example}", current.example)}</p>
        <div className="flex justify-end mt-3">
          <Button size="sm" color="danger" disabled={changed} onClick={() => setConfirmingConvert(true)}>
            {t("ticketReference.convert")}
          </Button>
        </div>
      </div>

      {confirmingConvert && (
        <DeleteWorkspaceModal
          workspaceName={workspaceName}
          busy={converting}
          title={t("ticketReference.convertTitle")}
          message={t("ticketReference.convertWarning")}
          confirmLabel={t("ticketReference.convert")}
          onConfirm={convert}
          onCancel={() => setConfirmingConvert(false)}
        />
      )}
    </div>
  );
}
