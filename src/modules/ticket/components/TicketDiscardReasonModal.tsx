interface Props {
  onSelectReason: (reason: string) => void;
  onCancel: () => void;
  t: (key: any) => string;
  tEnum: (prefix: string, value: string) => string;
}

const REASONS = ["duplicate", "spam", "no-response", "wont-fix"] as const;

export default function TicketDiscardReasonModal({ onSelectReason, onCancel, t, tEnum }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-body-bold text-heading mb-1">{t("ticketDetail.discardReasonTitle")}</h3>
        <p className="text-sm text-muted mb-4">{t("ticketDetail.discardReasonMessage")}</p>
        <div className="flex flex-col gap-2">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelectReason(reason)}
              className="w-full text-left px-3 py-2 rounded text-sm hover:bg-surface-hover transition-colors cursor-pointer text-body"
            >
              {tEnum("discardReason", reason)}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-3 text-xs text-subtle hover:text-secondary-text cursor-pointer"
        >
          {t("cannedResponses.cancel")}
        </button>
      </div>
    </div>
  );
}
