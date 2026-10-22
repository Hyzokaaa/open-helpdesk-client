import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import { REOPEN_NOTE_MIN_LENGTH, TEAM_REOPEN_REASONS, type TicketReopenReason } from "../services/ticket.service";
import { initialReopenTarget, reopenNoteLength, reopenTargetsFor, type ReopenTarget } from "../domain/ticket-reopen";

const TEAM_ROLES = ["admin", "supervisor", "agent"];

export interface ReopenTicketTarget {
  ticketNumber: string;
  name: string;
  status: string;
  assigneeId: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  /** Whether whoever resolved it left a comment then; unknown when left out. */
  resolvedWithComment?: boolean;
}

interface Props {
  ticket: ReopenTicketTarget;
  /** The workspace's people, to name them and to choose who takes it. */
  members: WorkspaceMember[];
  /** Whether the viewer may choose who takes it (ticket.assign). */
  canChooseAssignee: boolean;
  /** The board column the card was dropped on: the modal starts there. */
  droppedOn?: string;
  onConfirm: (data: { reason: TicketReopenReason; note: string; assigneeId?: string | null; status: ReopenTarget }) => Promise<void>;
  onCancel: () => void;
}

const SELECT_CLASS = "flex-1 h-8 rounded-md border border-border-input bg-surface text-sm text-body px-2 cursor-pointer";

/**
 * Reopening is deliberate: a reason and an explanation of at least 20 characters, both
 * required, unlike the one-click discard. It says what will happen before it does.
 */
export default function ReopenTicketModal({ ticket, members, canChooseAssignee, droppedOn, onConfirm, onCancel }: Props) {
  const { t, tEnum } = useTranslation();
  const formatDate = useFormatDate();
  const id = useId();
  const firstRadio = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState<TicketReopenReason | null>(null);
  const [note, setNote] = useState("");
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [saving, setSaving] = useState(false);

  const team = members.filter((m) => TEAM_ROLES.includes(m.role));
  const nameOf = (userId: string | null) => {
    const m = userId ? members.find((x) => x.userId === userId) : undefined;
    return m ? `${m.firstName} ${m.lastName}`.trim() : null;
  };
  // Whoever had it, or resolved it, if still on the team; otherwise the queue
  const defaultAssignee = [ticket.assigneeId, ticket.resolvedById].find((u) => u && team.some((m) => m.userId === u)) ?? null;
  // Where it goes follows the column it was dropped on; who takes it, whoever had it
  const [target, setTarget] = useState<ReopenTarget>(() => initialReopenTarget(droppedOn, canChooseAssignee));
  const [assignee, setAssignee] = useState<string>(defaultAssignee ?? "");

  useEffect(() => { firstRadio.current?.focus(); }, []);

  const length = reopenNoteLength(note);
  const valid = !!reason && length >= REOPEN_NOTE_MIN_LENGTH;
  const resolver = nameOf(ticket.resolvedById);
  // The queue takes nobody
  const goesTo = target === "open" ? null : assignee || null;
  const notified = [...new Set([goesTo, ticket.resolvedById].filter((u): u is string => !!u))].map(nameOf).filter(Boolean).join(", ");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (!valid || !reason) return;
    setSaving(true);
    try {
      await onConfirm({
        reason,
        note: note.trim(),
        status: target,
        ...(canChooseAssignee && target !== "open" && goesTo !== defaultAssignee ? { assigneeId: goesTo } : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet size="sm" onClose={onCancel}>
      <form onSubmit={submit} aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`}>
        <h3 id={`${id}-title`} className="text-base font-body-bold text-heading mb-1">
          {t("reopen.title").replace("{ticket}", ticket.ticketNumber)}
        </h3>
        <p id={`${id}-desc`} className="text-sm text-muted mb-3">{t("reopen.intro")}</p>

        {ticket.status === "resolved" && resolver && (
          <p className="text-xs text-secondary-text bg-surface-hover rounded-md px-3 py-2 mb-4">
            {t("reopen.resolvedBy").replace("{name}", resolver)}
            {ticket.resolvedAt && <> · {formatDate(ticket.resolvedAt)}</>}
            {ticket.resolvedWithComment === false && <> · <span className="text-amber-800 dark:text-amber-300">{t("reopen.noClosingComment")}</span></>}
          </p>
        )}

        <fieldset className="mb-4">
          <legend className="text-sm font-body-semibold text-heading mb-2">
            {t("reopen.why")} <span className="text-red-600" aria-hidden="true">*</span>
            <span className="sr-only"> ({t("reopen.required")})</span>
          </legend>
          <div className="flex flex-col gap-1.5">
            {TEAM_REOPEN_REASONS.map((r, i) => (
              <label
                key={r}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors",
                  reason === r ? "border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" : "border-border-input hover:bg-surface-hover text-body",
                )}
              >
                <input
                  ref={i === 0 ? firstRadio : undefined}
                  type="radio"
                  name={`${id}-reason`}
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-amber-700"
                />
                {tEnum("reopenReason", r)}
              </label>
            ))}
          </div>
          {triedSubmit && !reason && <p role="alert" className="text-xs text-red-600 mt-1.5">{t("reopen.chooseReason")}</p>}
        </fieldset>

        <div className="mb-4">
          <label htmlFor={`${id}-note`} className="block text-sm font-body-semibold text-heading mb-1">
            {t("reopen.explain")} <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <p id={`${id}-note-help`} className="text-xs text-muted mb-1.5">{t("reopen.teamOnly")}</p>
          <textarea
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            aria-invalid={triedSubmit && length < REOPEN_NOTE_MIN_LENGTH}
            aria-describedby={`${id}-note-help ${id}-note-count`}
            rows={4}
            className="w-full bg-surface rounded-input border border-border-input px-3 py-2 text-sm text-body outline-none focus:border-primary-400"
          />
          <p
            id={`${id}-note-count`}
            aria-live="polite"
            className={clsx("text-xs mt-1", length >= REOPEN_NOTE_MIN_LENGTH ? "text-muted" : triedSubmit ? "text-red-600" : "text-muted")}
          >
            {t("reopen.count").replace("{count}", String(length)).replace("{min}", String(REOPEN_NOTE_MIN_LENGTH))}
          </p>
        </div>

        <div className="mb-4 text-sm flex flex-col gap-2">
          <label className="flex items-center gap-2 text-secondary-text">
            <span className="w-24 shrink-0">{t("reopen.goesTo")}</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as ReopenTarget)}
              className={SELECT_CLASS}
            >
              {reopenTargetsFor(canChooseAssignee).map((s) => (
                <option key={s} value={s}>{tEnum("status", s)}</option>
              ))}
            </select>
          </label>
          {target === "open" ? (
            <p className="text-xs text-muted">{t("reopen.queueTakesNobody")}</p>
          ) : canChooseAssignee ? (
            <label className="flex items-center gap-2 text-secondary-text">
              <span className="w-24 shrink-0">{t("reopen.assignedTo")}</span>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={SELECT_CLASS}>
                {!assignee && <option value="" disabled>{t("reopen.chooseSomeone")}</option>}
                {team.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {`${m.firstName} ${m.lastName}`.trim()}{m.userId === ticket.resolvedById ? ` (${t("reopen.whoResolved")})` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : goesTo ? (
            <p className="text-secondary-text">{t("reopen.assignedTo")} {nameOf(goesTo)}</p>
          ) : null}
          {/* Work needs somebody: with nobody to take it, it lands in the queue, as the backend does */}
          {target !== "open" && !goesTo && (
            <p className="text-xs text-amber-800 dark:text-amber-300">{t("reopen.nobodyGoesToQueue")}</p>
          )}
        </div>

        <p className="text-xs text-muted mb-5">
          {notified ? t("reopen.weTell").replace("{names}", notified) : ""} {t("reopen.requesterTold")}
        </p>

        <div className="flex justify-end gap-2">
          <Button size="sm" color="light" type="button" onClick={onCancel}>{t("ticketDetail.cancel")}</Button>
          <button
            type="submit"
            disabled={saving}
            aria-disabled={!valid || undefined}
            className={clsx(
              "px-3 py-1.5 rounded-md text-sm font-body-semibold text-white transition-colors",
              valid ? "bg-amber-700 hover:bg-amber-800 cursor-pointer" : "bg-amber-700/50 cursor-not-allowed",
            )}
          >
            {t("reopen.confirm")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
