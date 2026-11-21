import { useEffect, useId, useRef, useState } from "react";
import { toast } from "react-toastify";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Checkbox from "@modules/app/modules/ui/components/Checkbox/Checkbox";
import Select from "@modules/app/modules/ui/components/Select/Select";
import OptionPicker from "@modules/app/modules/ui/components/OptionPicker/OptionPicker";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import { listDepartments } from "@modules/department/services/department.service";
import { listProjects } from "@modules/project/services/project.service";
import { listOrganizations } from "@modules/organization/services/organization.service";
import MatrixRoomCheckLine from "./MatrixRoomCheckLine";
import {
  MATRIX_NOTICE_EVENTS,
  MatrixNoticeEvent,
  MatrixRoomCheckDto,
  MatrixRoomDto,
  MatrixRoomScope,
  checkMatrixRoom,
  leaveCheckedMatrixRoom,
  saveMatrixRoom,
} from "../services/matrix.service";

const SCOPES: MatrixRoomScope[] = ["workspace", "organization", "project", "department"];
type RoomMode = "existing" | "create";

/** "@a:x.org, @b:y.org" → each ID once. */
const parseInvite = (text: string) => [...new Set(text.split(/[\s,;]+/).filter(Boolean))];

interface Props {
  slug: string;
  /** Names a room the bot creates for the whole workspace. */
  workspaceName: string;
  botUserId: string;
  /** The room being edited; null to add one. */
  room: MatrixRoomDto | null;
  /** The workspace's other rooms: a scope they have is not offered again. */
  otherRooms: MatrixRoomDto[];
  defaultEvents: MatrixNoticeEvent[];
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Adds or edits one room: which tickets it hears of, the Matrix room, and what it is told. */
export default function MatrixRoomForm({ slug, workspaceName, botUserId, room: saved, otherRooms, defaultEvents, onSaved, onDirtyChange }: Props) {
  const { t } = useTranslation();
  const taken = (scope: MatrixRoomScope) => otherRooms.filter((r) => r.scope === scope).map((r) => r.scopeId);
  const [choices, setChoices] = useState<Record<Exclude<MatrixRoomScope, "workspace">, { id: string; name: string }[]> | null>(null);
  const firstScope = saved?.scope ?? (taken("workspace").length === 0 ? "workspace" : "organization");
  const [scope, setScope] = useState<MatrixRoomScope>(firstScope);
  const [scopeId, setScopeId] = useState<string | null>(saved?.scopeId ?? null);
  const [room, setRoom] = useState(saved?.roomId ?? "");
  const [mode, setMode] = useState<RoomMode>("existing");
  const [newName, setNewName] = useState<string | null>(null);
  const [invite, setInvite] = useState("");
  const [events, setEvents] = useState<MatrixNoticeEvent[]>(saved?.events ?? defaultEvents);
  const [includeText, setIncludeText] = useState(saved?.includeText ?? false);
  const [includeFiles, setIncludeFiles] = useState(saved?.includeFiles ?? false);
  const [onlyWithoutOther, setOnlyWithoutOther] = useState(saved?.onlyTicketsWithoutOtherRoom ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<{ typed: string; result: MatrixRoomCheckDto } | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const { installationName } = useConfig();
  const ids = { roomHint: useId(), check: useId(), checkError: useId(), scoped: useId(), newRoomHint: useId(), inviteHint: useId() };
  // Rooms the bot joined to check them: on closing it leaves those that were not saved (the server
  // keeps it in every room it writes in, the one just saved included)
  const checkedRooms = useRef(new Set<string>());
  useEffect(() => () => {
    for (const roomId of checkedRooms.current) void leaveCheckedMatrixRoom(slug, roomId);
  }, [slug]);

  useEffect(() => {
    Promise.all([listOrganizations(slug, { silent: true }), listProjects(slug, { silent: true }), listDepartments(slug, { silent: true })])
      .then(([organization, project, department]) => setChoices({
        organization: organization.map((o) => ({ id: o.id, name: o.name })),
        project: project.map((p) => ({ id: p.id, name: p.name })),
        department: department.map((d) => ({ id: d.id, name: d.name })),
      }))
      .catch(() => setChoices({ organization: [], project: [], department: [] }));
  }, [slug]);

  const available = (s: Exclude<MatrixRoomScope, "workspace">) => (choices?.[s] ?? []).filter((c) => !taken(s).includes(c.id));
  const scoped = scope !== "workspace";
  const typed = room.trim();
  const creating = mode === "create";
  // Follows the organization, project or department picked until the name is typed by hand
  const scopeName = scoped ? choices?.[scope].find((c) => c.id === scopeId)?.name ?? saved?.scopeName ?? null : workspaceName;
  // The installation's own name (Settings → Branding), not ours
  const name = newName ?? (scopeName ? `${installationName} · ${scopeName}` : installationName);
  const shown = check && (check.typed === typed || check.result.roomId === typed) ? check.result : null;

  const dirty = creating || (!saved
    ? typed !== "" || scopeId !== null
    : typed !== saved.roomId || scope !== saved.scope || scopeId !== saved.scopeId || includeText !== saved.includeText
      || includeFiles !== saved.includeFiles || onlyWithoutOther !== saved.onlyTicketsWithoutOtherRoom
      || events.length !== saved.events.length || events.some((e) => !saved.events.includes(e)));
  useEffect(() => onDirtyChange(dirty), [dirty]);

  const runCheck = async (target: string) => {
    setChecking(true);
    setCheckError(null);
    try {
      const result = await checkMatrixRoom(slug, target);
      if (result.roomId !== saved?.roomId) checkedRooms.current.add(result.roomId);
      setCheck({ typed: target, result });
    } catch (err) {
      setCheck(null);
      setCheckError((err as HttpResponseError).message || t("matrix.checkFailed"));
    } finally {
      setChecking(false);
    }
  };

  const toggle = (event: MatrixNoticeEvent, on: boolean) =>
    setEvents(on ? [...events, event] : events.filter((e) => e !== event));

  const changeScope = (next: MatrixRoomScope) => {
    setScope(next);
    setScopeId(next === saved?.scope ? saved.scopeId : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { created } = await saveMatrixRoom(slug, saved?.id ?? null, {
        ...(creating ? { newRoom: { name: name.trim(), invite: parseInvite(invite) } } : { room: typed }),
        scope,
        scopeId: scoped ? scopeId : null,
        events,
        includeText,
        includeFiles,
        onlyTicketsWithoutOtherRoom: !scoped && onlyWithoutOther,
      });
      toast.success(t(created ? "matrix.roomCreated" : "matrix.roomSaved"));
      if (created && created.notInvited.length > 0) {
        toast.warning(t("matrix.notInvited").replace("{users}", created.notInvited.map((n) => `${n.userId} (${n.error})`).join(", ")), { autoClose: false });
      }
      if (created && !created.adminsSet) toast.warning(t("matrix.adminsNotSet"), { autoClose: false });
      onDirtyChange(false);
      onSaved();
    } catch (err) {
      const e = err as HttpResponseError;
      setError(e.code === "matrix-too-many-rooms" ? t("matrix.tooManyRooms") : e.message || t("matrix.roomError"));
    } finally {
      setSaving(false);
    }
  };

  const scopeOptions = SCOPES.map((s) => ({
    value: s,
    label: t(`matrix.scope.${s}` as any),
    description: s === "workspace" && taken("workspace").length > 0 ? t("matrix.scope.workspaceTaken") : t(`matrix.scope.${s}Hint` as any),
    disabled: s === "workspace" ? taken("workspace").length > 0 : choices !== null && available(s).length === 0,
  }));

  return (
    <form onSubmit={handleSave}>
      <h2 className="text-lg font-body-bold text-heading mb-1">{saved ? t("matrix.editRoom") : t("matrix.addRoom")}</h2>
      <p className="text-sm text-muted mb-6">{t("matrix.roomSheetDescription")}</p>

      <OptionPicker label={t("matrix.scopeField")} value={scope} options={scopeOptions} onChange={changeScope} />

      {scoped && (
        <FormInput label={t(`matrix.scope.${scope}Field` as any)} required>
          <Select
            options={available(scope)}
            label={(c) => c.name}
            value={(c) => c.id === scopeId}
            onChange={(c) => setScopeId(c.id)}
            placeholder={saved?.scopeId === scopeId && saved?.scopeName === null && scopeId ? t("matrix.scopeDeleted") : t(`matrix.scope.${scope}Pick` as any)}
            searchable
          />
        </FormInput>
      )}

      <div className="border-t border-border-card my-4" />

      <OptionPicker
        label={t("matrix.roomModeField")}
        value={mode}
        options={(["existing", "create"] as const).map((m) => ({ value: m, label: t(`matrix.roomMode.${m}`), description: t(`matrix.roomMode.${m}Hint`) }))}
        onChange={setMode}
      />

      {creating ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormInput label={t("matrix.newRoomName")} required>
              <Input value={name} onChange={setNewName} describedBy={scoped ? `${ids.newRoomHint} ${ids.scoped}` : ids.newRoomHint} />
            </FormInput>
            <FormInput label={t("matrix.newRoomInvite")}>
              <Input value={invite} onChange={setInvite} placeholder="@ana:example.org, @luis:example.org" describedBy={ids.inviteHint} />
              <p id={ids.inviteHint} className="text-exs text-subtle mt-1">{t("matrix.newRoomInviteHint")}</p>
            </FormInput>
          </div>
          <p id={ids.newRoomHint} className="text-exs text-subtle -mt-2 mb-3">{t("matrix.newRoomHint")}</p>
        </>
      ) : (
      <FormInput label={t("matrix.roomField")} required>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <Input
              value={room}
              onChange={(value) => { setRoom(value); setCheckError(null); }}
              placeholder="!abc123:example.org · #support:example.org"
              describedBy={[shown && ids.check, checkError && ids.checkError, ids.roomHint, scoped && ids.scoped].filter(Boolean).join(" ")}
              invalid={!!checkError}
            />
          </div>
          <Button size="xs" type="button" color="light" loading={checking} disabled={!typed} onClick={() => runCheck(typed)}>{t("matrix.checkRoom")}</Button>
        </div>
        {/* Stays on the page, so each new result is announced */}
        <div aria-live="polite">{shown && <MatrixRoomCheckLine check={shown} className="mt-1" id={ids.check} live={false} />}</div>
        {checkError && <p id={ids.checkError} className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{checkError}</p>}
        <p id={ids.roomHint} className="text-exs text-subtle mt-1">{t("matrix.roomHint").replace("{bot}", botUserId)}</p>
      </FormInput>
      )}

      {scoped && <p id={ids.scoped} className="text-exs text-amber-700 dark:text-amber-300 -mt-2 mb-3">{t("matrix.scopedRoomWarning")}</p>}

      <div className="border-t border-border-card my-4" />

      <fieldset className="mb-4">
        <legend className="text-xs font-body-semibold text-heading mb-2">{t("matrix.events")}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {MATRIX_NOTICE_EVENTS.map((event) => (
            <Checkbox key={event} size="xs" checked={events.includes(event)} onChange={(on) => toggle(event, on)} label={t(`matrix.event.${event}` as any)} />
          ))}
        </div>
      </fieldset>

      <div className="border-t border-border-card my-4" />

      <div className="space-y-3">
        <Checkbox checked={includeText} onChange={setIncludeText} label={t("matrix.includeText")} hint={t("matrix.includeTextHint")} />
        <Checkbox checked={includeFiles} onChange={setIncludeFiles} label={t("matrix.includeFiles")} hint={t("matrix.includeFilesHint")} />
        {!scoped && (
          <Checkbox checked={onlyWithoutOther} onChange={setOnlyWithoutOther} label={t("matrix.onlyWithoutOtherRoom")} hint={t("matrix.onlyWithoutOtherRoomHint")} />
        )}
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-4" role="alert">{error}</p>}

      <div className="mt-5">
        <Button size="sm" type="submit" full loading={saving} disabled={(creating ? !name.trim() : !typed) || (scoped && !scopeId) || (saved !== null && !dirty)}>
          {creating ? t(saved ? "matrix.createAndSave" : "matrix.createAndAdd") : saved ? t("matrix.saveRoom") : t("matrix.addRoom")}
        </Button>
      </div>
    </form>
  );
}
