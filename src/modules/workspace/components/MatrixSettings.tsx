import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import Button from "@modules/app/modules/ui/components/Button/Button";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Checkbox from "@modules/app/modules/ui/components/Checkbox/Checkbox";
import useTranslation from "@modules/app/i18n/useTranslation";
import MatrixBotForm from "./MatrixBotForm";
import MatrixRoomForm from "./MatrixRoomForm";
import {
  MATRIX_NOTICE_EVENTS,
  MatrixRoomCheckDto,
  MatrixRoomDto,
  MatrixRoomStatusDto,
  MatrixSettingsDto,
  checkMatrixRoom,
  connectMatrixBot,
  disconnectMatrixBot,
  getMatrixRoomStatus,
  getMatrixSettings,
  pauseMatrixRoom,
  removeMatrixRoom,
  testMatrixRoom,
} from "../services/matrix.service";

interface Props {
  slug: string;
  /** Names a room the bot creates for the whole workspace. */
  workspaceName: string;
}

/**
 * The workspace's Matrix notices: which bot writes them (its own or the installation's) and to which rooms.
 * Everything is on the page: the bot's form opens in place, and the rooms and their events show even
 * before there is a bot, so an admin sees what they would get.
 */
export default function MatrixSettings({ slug, workspaceName }: Props) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<MatrixSettingsDto | null>(null);
  const [editingBot, setEditingBot] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const reload = () => getMatrixSettings(slug).then(setSettings);
  useEffect(() => {
    reload();
  }, [slug]);

  if (!settings) return null;
  const bot = settings.ownBot ?? settings.installationBot;

  const handleDisconnect = async () => {
    setConfirmDisconnect(false);
    try {
      const { sessionEnded } = await disconnectMatrixBot(slug);
      toast.success(t(sessionEnded ? "matrix.disconnected" : "matrix.disconnectedOffline"));
      await reload();
    } catch (err) {
      toast.error((err as HttpResponseError).message);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">{t("matrix.description")}</p>

      <section className="space-y-2">
        <h3 className="text-sm font-body-semibold text-heading">{t("matrix.bot")}</h3>
        {settings.ownBot ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-card bg-surface">
            <div className="min-w-0">
              <p className="text-sm text-body font-body-medium truncate">{settings.ownBot.userId}</p>
              <p className="text-exs text-muted truncate">{t("matrix.ownBot")} · {settings.ownBot.homeserverUrl}</p>
              {!settings.ownBot.tokenReadable && <p className="text-exs text-amber-700 dark:text-amber-300 mt-1">{t("matrix.tokenUnreadable")}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="xs" color="light" onClick={() => setEditingBot(true)} disabled={editingBot}>{t("tickets.edit")}</Button>
              <Button size="xs" color="danger" onClick={() => setConfirmDisconnect(true)}>{t("matrix.disconnect")}</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            {settings.installationBot ? (
              <div className="flex items-center gap-2.5 p-3 bg-surface-active rounded-lg min-w-0">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-body font-body-medium truncate">{settings.installationBot.userId}</p>
                  <p className="text-exs text-muted">{t("matrix.usingInstallationBot")}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">{t("matrix.noBot")}</p>
            )}
            {settings.installationBot && (
              <Button size="xs" color="light" onClick={() => setEditingBot(true)} disabled={editingBot}>{t("matrix.useOwnBot")}</Button>
            )}
          </div>
        )}
        {/* With no bot at all the form is open: connecting one is the next step */}
        {(!bot || editingBot) && (
          <MatrixBotForm
            key={settings.ownBot?.userId ?? "new"}
            connect={(body) => connectMatrixBot(slug, body)}
            current={settings.ownBot && { ...settings.ownBot, label: t("matrix.ownBot") }}
            onConnected={() => { setEditingBot(false); reload(); }}
            onCancel={bot ? () => setEditingBot(false) : undefined}
          />
        )}
      </section>

      <MatrixRoomList slug={slug} workspaceName={workspaceName} botUserId={bot?.userId ?? null} settings={settings} onChange={reload} />

      {confirmDisconnect && (
        <ConfirmModal
          title={t("matrix.disconnectTitle")}
          message={t("matrix.disconnectMessage")}
          confirmLabel={t("matrix.disconnect")}
          danger
          onConfirm={handleDisconnect}
          onCancel={() => setConfirmDisconnect(false)}
        />
      )}
    </div>
  );
}

/**
 * The workspace's rooms, each with its state and actions, like the mailboxes; added and edited in a sheet.
 * Without a bot they are shown but cannot be added nor acted on, and the events a room can hear of are listed.
 */
function MatrixRoomList({ slug, workspaceName, botUserId, settings, onChange }: {
  slug: string;
  workspaceName: string;
  botUserId: string | null;
  settings: MatrixSettingsDto;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<MatrixRoomDto | "new" | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);
  const isDirtyRef = useRef(false);
  const [removing, setRemoving] = useState<MatrixRoomDto | null>(null);
  const [botLeaves, setBotLeaves] = useState(false);
  // undefined while checking, null when the check failed; a status with inRoom false: the bot was taken out
  const [checks, setChecks] = useState<Record<string, MatrixRoomCheckDto | MatrixRoomStatusDto | null | undefined>>({});

  const check = async (room: MatrixRoomDto) => {
    setChecks((prev) => ({ ...prev, [room.id]: undefined }));
    try {
      const result = await checkMatrixRoom(slug, room.roomId);
      setChecks((prev) => ({ ...prev, [room.id]: result }));
    } catch (err) {
      setChecks((prev) => ({ ...prev, [room.id]: null }));
      throw err;
    }
  };

  // Each room is looked at on opening, without the bot entering it: a room deleted or a bot taken out
  // since shows here, and only "Check room" makes the bot join again
  const roomIds = settings.rooms.map((r) => `${r.id}:${r.roomId}`).join(",");
  useEffect(() => {
    // Nobody can look into a room without a bot
    if (!botUserId) return;
    for (const room of settings.rooms) {
      setChecks((prev) => ({ ...prev, [room.id]: undefined }));
      getMatrixRoomStatus(slug, room.id)
        .then((status) => setChecks((prev) => ({ ...prev, [room.id]: status })))
        .catch(() => setChecks((prev) => ({ ...prev, [room.id]: null })));
    }
  }, [slug, roomIds, botUserId]);

  const closeSheet = () => {
    if (isDirtyRef.current) setShowDiscard(true);
    else setEditing(null);
  };

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (err) {
      toast.error((err as HttpResponseError).message);
    }
    onChange();
  };

  const test = (room: MatrixRoomDto) => run(async () => {
    const result = await testMatrixRoom(slug, room.id);
    if (result.success) toast.success(t("matrix.testSent"));
    else toast.error(result.error ?? t("matrix.roomError"));
  });

  const handleRemove = async () => {
    const room = removing;
    setRemoving(null);
    if (!room) return;
    await run(async () => {
      const left = await removeMatrixRoom(slug, room.id, botLeaves);
      toast.success(t(left?.left ? "matrix.roomRemovedBotLeft" : "matrix.roomRemoved"));
      if (left && !left.left) toast.warning(t("matrix.botStayed").replace("{error}", left.error ?? ""), { autoClose: false });
    });
  };

  const scopeLabel = (room: MatrixRoomDto) => room.scope === "workspace"
    ? t("matrix.scope.workspace")
    : `${t(`matrix.scope.${room.scope}Field` as any)}: ${room.scopeName ?? t("matrix.scopeDeleted")}`;

  const membersOf = (found: MatrixRoomCheckDto) => found.members === null
    ? null
    : t(found.members === 1 ? "matrix.roomMembersOne" : "matrix.roomMembers").replace("{count}", String(found.members));

  return (
    <section className="border-t border-border-card pt-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-body-semibold text-heading">{t("matrix.rooms")}</h3>
        <Button size="xs" color="light" onClick={() => setEditing("new")} disabled={!botUserId}>{t("matrix.addRoom")}</Button>
      </div>
      {!botUserId && <p className="text-xs text-muted mb-3">{t("matrix.roomsNeedBot")}</p>}

      {settings.rooms.length === 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted">{t("matrix.noRooms")}</p>
          {/* What a room can hear of, ticked as a new room starts, before any room exists */}
          <fieldset>
            <legend className="text-xs font-body-semibold text-heading mb-1">{t("matrix.events")}</legend>
            <p className="text-exs text-subtle mb-2">{t("matrix.eventsPreview")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {MATRIX_NOTICE_EVENTS.map((event) => (
                <Checkbox key={event} size="xs" disabled checked={settings.defaultEvents.includes(event)} onChange={() => {}} label={t(`matrix.event.${event}` as any)} />
              ))}
            </div>
          </fieldset>
        </div>
      ) : (
        <div className="space-y-2">
          {settings.rooms.map((room) => {
            const checked = checks[room.id];
            const botOut = !!checked && "inRoom" in checked && !checked.inRoom;
            const found = botOut ? undefined : checked;
            const events = t(room.events.length === 1 ? "matrix.eventsCountOne" : "matrix.eventsCount").replace("{count}", String(room.events.length));
            const details = found ? [found.alias, membersOf(found), events] : [room.roomId, checked === null ? t("matrix.checkFailed") : null, events];
            return (
              <div key={room.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-card bg-surface">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${room.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-body-medium text-body break-all">
                      {found?.name ?? room.roomId}
                      <span className="ml-2 inline-block px-1.5 rounded-full border border-border-card text-exs text-muted font-body-medium break-normal">{scopeLabel(room)}</span>
                    </p>
                    {botOut && botUserId && <p className="text-exs text-amber-800 dark:text-amber-200">{t("matrix.botOut").replace("{bot}", botUserId)}</p>}
                    {room.isActive ? (
                      <p className="text-exs text-muted break-all">{details.filter(Boolean).join(" · ")}</p>
                    ) : (
                      <p className="text-exs text-red-600 dark:text-red-400">{t("matrix.paused")}</p>
                    )}
                    {room.lastError && <p className="text-exs text-muted break-words">{t("matrix.lastError")}: {room.lastError}</p>}
                  </div>
                </div>
                {botUserId && <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => (room.isActive ? run(() => pauseMatrixRoom(slug, room.id)) : test(room))}
                    title={room.isActive ? t("matrix.pause") : t("matrix.resume")}
                    aria-label={room.isActive ? t("matrix.pause") : t("matrix.resume")}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-hover text-muted hover:text-body transition-colors cursor-pointer"
                  >
                    {room.isActive ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>
                  <ActionMenu
                    items={[
                      { label: t("common.edit"), onClick: () => setEditing(room) },
                      { label: t("matrix.test"), onClick: () => test(room) },
                      { label: t("matrix.checkRoom"), onClick: () => run(() => check(room)) },
                      {
                        label: t("matrix.removeRoom"),
                        // Offered checked when nobody but the bot is in the room: leaving it there is pointless
                        onClick: () => { setBotLeaves((checks[room.id]?.members ?? 2) <= 1); setRemoving(room); },
                        danger: true,
                      },
                    ]}
                  />
                </div>}
              </div>
            );
          })}
          <p className="text-exs text-subtle">{t("matrix.roomsHint")}</p>
        </div>
      )}

      {editing && botUserId && (
        <Sheet onClose={closeSheet}>
          <MatrixRoomForm
            slug={slug}
            workspaceName={workspaceName}
            botUserId={botUserId}
            room={editing === "new" ? null : editing}
            otherRooms={settings.rooms.filter((r) => editing === "new" || r.id !== editing.id)}
            defaultEvents={settings.defaultEvents}
            onSaved={() => { isDirtyRef.current = false; setEditing(null); onChange(); }}
            onDirtyChange={(d) => { isDirtyRef.current = d; }}
          />
        </Sheet>
      )}

      {showDiscard && (
        <ConfirmModal
          title={t("discard.title")}
          message={t("discard.message")}
          confirmLabel={t("discard.confirm")}
          danger
          onConfirm={() => { setShowDiscard(false); isDirtyRef.current = false; setEditing(null); }}
          onCancel={() => setShowDiscard(false)}
        />
      )}

      {removing && (
        <ConfirmModal
          title={t("matrix.removeRoomTitle")}
          message={t("matrix.removeRoomMessage")}
          confirmLabel={t("matrix.removeRoom")}
          danger
          onConfirm={handleRemove}
          onCancel={() => setRemoving(null)}
        >
          <div className="mt-3">
            <Checkbox checked={botLeaves} onChange={setBotLeaves} label={t("matrix.botLeaves")} hint={t("matrix.botLeavesHint")} />
          </div>
        </ConfirmModal>
      )}
    </section>
  );
}
