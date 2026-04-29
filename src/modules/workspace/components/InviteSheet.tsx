import { useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import { createInvitation } from "../services/invitation.service";
import useTranslation from "@modules/app/i18n/useTranslation";

const ROLES = ["admin", "agent", "reporter"] as const;

interface Props {
  workspaceSlug: string;
  onClose: () => void;
  onSent?: () => void;
}

export default function InviteSheet({ workspaceSlug, onClose, onSent }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([{ email: "", role: "reporter" }]);
  const [sending, setSending] = useState(false);

  const updateRow = (index: number, field: "email" | "role", value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { email: "", role: "reporter" }]);
  };

  const validRows = rows.filter((r) => r.email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validRows.length === 0) return;
    setSending(true);
    let sent = 0;
    for (const row of validRows) {
      try {
        await createInvitation(workspaceSlug, { email: row.email.trim(), role: row.role });
        sent++;
      } catch {
        toast.error(`${t("invitations.sendError")}: ${row.email}`);
      }
    }
    if (sent > 0) {
      toast.success(`${sent} ${t("invitations.sent")}`);
      onSent?.();
      onClose();
    }
    setSending(false);
  };

  return (
    <Sheet onClose={onClose}>
      <div className="w-full">
        <h2 className="text-lg font-body-bold text-heading mb-3">{t("invitations.invite")}</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-3 items-end">
                <FormInput label={i === 0 ? t("invitations.email") : undefined} required className="flex-[3] !mb-0">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={row.email}
                    onChange={(v) => updateRow(i, "email", v)}
                  />
                </FormInput>
                <FormInput label={i === 0 ? t("members.role") : undefined} required className="flex-1 !mb-0">
                  <Select
                    options={[...ROLES]}
                    label={(r) => r}
                    value={(r) => r === row.role}
                    onChange={(r) => updateRow(i, "role", r)}
                  />
                </FormInput>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="w-8 h-8 flex items-center justify-center text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full mt-3 py-2 border-2 border-dashed border-border-input rounded-lg text-xs font-body-medium text-muted hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
          >
            + {t("invitations.addAnother")}
          </button>

          <div className="flex justify-end gap-2 mt-6">
            <Button size="sm" color="light" onClick={onClose}>
              {t("members.cancel")}
            </Button>
            <Button type="submit" size="sm" loading={sending} disabled={validRows.length === 0}>
              {t("invitations.send")}
            </Button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
