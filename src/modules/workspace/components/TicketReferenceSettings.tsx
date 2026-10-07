import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { TicketReferenceSettings as Settings, getTicketReference, updateTicketReference } from "../services/workspace.service";

interface Props {
  slug: string;
}

/**
 * How the workspace shows its ticket references: sequential (TK-000042) or random (TK-7QX4M2K),
 * and with which prefix. Only how they look changes: every ticket keeps its number, and a search
 * still finds a ticket by its old reference.
 */
export default function TicketReferenceSettings({ slug }: Props) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<Settings | null>(null);
  const [style, setStyle] = useState<"sequential" | "random">("sequential");
  const [prefix, setPrefix] = useState("TK");
  const [saving, setSaving] = useState(false);

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
    </div>
  );
}
