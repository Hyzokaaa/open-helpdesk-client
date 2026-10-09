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
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Label from "@modules/app/modules/ui/components/Label/Label";

const PREFIX_PATTERN = /^[A-Z0-9]{1,10}$/;
const SAMPLE_RANDOM_CODE = "7QX4M2K";

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

  const changed = style !== current.style || prefix !== current.prefix;
  const prefixValid = PREFIX_PATTERN.test(prefix);
  // The random code needs the workspace secret, which only exists once random has been saved; until
  // then a fixed sample shows the shape. Either way it is ticket 42, like the sequential example.
  const savedCode = current.style === "random" ? current.example.split("-").pop() : null;
  const preview = !prefixValid ? "—" : style === "sequential" ? `${prefix}-000042` : `${prefix}-${savedCode ?? SAMPLE_RANDOM_CODE}`;

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
      <p className="text-xs text-muted mb-4">{t("ticketReference.intro")}</p>

      <div className="mb-1.5"><Label>{t("ticketReference.format")}</Label></div>
      <Toggle
        left={t("ticketReference.sequential")}
        right={t("ticketReference.random")}
        active={style === "random" ? "right" : "left"}
        onChange={(value) => setStyle(value === "right" ? "random" : "sequential")}
      />
      <p className="text-xs text-muted mt-2">
        {t(style === "random" ? "ticketReference.randomHint" : "ticketReference.sequentialHint")}
      </p>

      <div className="mt-5 flex flex-wrap items-start gap-x-6 gap-y-3">
        <FormInput label={t("ticketReference.prefix")} className="!mb-0 max-w-xs">
          <Input value={prefix} onChange={(v) => setPrefix(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} />
          <p className={prefixValid ? "text-xs text-muted mt-1" : "text-xs text-red-600 dark:text-red-400 mt-1"}>
            {t(prefixValid ? "ticketReference.prefixHint" : "ticketReference.prefixInvalid")}
          </p>
        </FormInput>
        <FormInput label={t("ticketReference.example")} className="!mb-0 !w-auto">
          <span className="inline-block font-mono text-sm font-body-semibold text-heading bg-surface-hover rounded-md px-2.5 py-1.5">{preview}</span>
        </FormInput>
      </div>

      {changed && (
        <p className="rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 mt-5">
          {t("ticketReference.changeNote")}
        </p>
      )}
      <div className="flex justify-end mt-3">
        <Button size="sm" loading={saving} disabled={!changed || !prefixValid} onClick={save}>{t("ticketReference.save")}</Button>
      </div>

      <div className="mt-6 rounded-lg border border-red-300 dark:border-red-900/50 p-4">
        <p className="text-sm font-body-semibold text-heading">{t("ticketReference.convertTitle")}</p>
        <p className="text-xs text-muted mt-1">{t("ticketReference.convertHint").replace("{example}", current.example)}</p>
        <div className="flex items-center justify-end gap-3 mt-3">
          {changed && <p className="text-xs text-muted">{t("ticketReference.convertBlocked")}</p>}
          <Button size="sm" color="danger-light" disabled={changed} onClick={() => setConfirmingConvert(true)}>
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
