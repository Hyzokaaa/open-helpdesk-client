import Button from "@modules/app/modules/ui/components/Button/Button";
import type { FieldChange } from "../domain/get-ticket-changes";

interface Props {
  changes: FieldChange[];
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: any) => string;
}

export default function TicketReviewChangesModal({ changes, saving, onConfirm, onCancel, t }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-body-bold text-heading mb-4">{t("ticketDetail.reviewChangesTitle")}</h3>
        <table className="w-full text-sm mb-4" style={{ borderSpacing: "0 4px" }}>
          <thead>
            <tr className="text-left text-xs text-subtle border-b border-border-row">
              <th className="pb-2 pr-6 font-body-medium">{t("ticketDetail.field")}</th>
              <th className="pb-2 pr-6 font-body-medium">{t("ticketDetail.from")}</th>
              <th className="pb-2 font-body-medium">{t("ticketDetail.to")}</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => (
              <tr key={c.field} className="border-b border-border-row last:border-0">
                <td className="py-2.5 pr-6 text-muted font-body-medium whitespace-nowrap">{c.field}</td>
                <td className="py-2.5 pr-6 text-body line-through opacity-50">{c.from || "—"}</td>
                <td className="py-2.5 text-body font-body-semibold">{c.to || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end gap-2">
          <Button size="xs" color="light" onClick={onCancel}>{t("ticketDetail.cancel")}</Button>
          <Button size="xs" color="primary" loading={saving} onClick={onConfirm}>{t("ticketDetail.confirmSave")}</Button>
        </div>
      </div>
    </div>
  );
}
