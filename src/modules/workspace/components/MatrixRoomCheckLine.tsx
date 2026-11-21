import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";
import { MatrixRoomCheckDto } from "../services/matrix.service";

/** "✓ name · alias · N members": the room as the bot found it. */
/** `live` false inside a region that already announces it (one that stays on the page while the result changes). */
export default function MatrixRoomCheckLine({ check, className, id, live = true }: { check: MatrixRoomCheckDto; className?: string; id?: string; live?: boolean }) {
  const { t } = useTranslation();
  return (
    <p className={clsx("text-xs text-green-700 dark:text-green-400 break-words", className)} id={id} role={live ? "status" : undefined}>
      ✓ {check.name ?? t("matrix.roomFoundNoName")}
      {check.alias && check.alias !== check.name && <span className="text-muted"> · {check.alias}</span>}
      {check.members !== null && <span className="text-muted"> · {t(check.members === 1 ? "matrix.roomMembersOne" : "matrix.roomMembers").replace("{count}", String(check.members))}</span>}
    </p>
  );
}
