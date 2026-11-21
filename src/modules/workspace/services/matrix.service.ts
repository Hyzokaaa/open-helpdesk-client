import { http } from "@modules/app/modules/http/domain/http";

/** What a Matrix room can be told about, in the order the settings list them. */
export const MATRIX_NOTICE_EVENTS = ["ticket-created", "unattended-reply", "customer-reply", "team-comment", "ticket-assigned", "status-changed", "sla-breached"] as const;
export type MatrixNoticeEvent = (typeof MATRIX_NOTICE_EVENTS)[number];

/** Which tickets a room hears of. */
export type MatrixRoomScope = "workspace" | "organization" | "project" | "department";

export interface MatrixBotDto {
  userId: string;
  homeserverUrl: string;
  deviceId: string | null;
  /** False when the saved token can no longer be read: the bot has to be connected again. */
  tokenReadable: boolean;
}

export interface MatrixRoomDto {
  id: string;
  roomId: string;
  scope: MatrixRoomScope;
  /** The organization, project or department; null for the whole workspace. */
  scopeId: string | null;
  /** Its name; null for the whole workspace, or when it was deleted. */
  scopeName: string | null;
  onlyTicketsWithoutOtherRoom: boolean;
  events: MatrixNoticeEvent[];
  includeText: boolean;
  includeFiles: boolean;
  isActive: boolean;
  lastError: string | null;
  lastErrorAt: string | null;
}

export interface MatrixSettingsDto {
  ownBot: MatrixBotDto | null;
  installationBot: { userId: string } | null;
  /** The room of the whole workspace first. */
  rooms: MatrixRoomDto[];
  events: MatrixNoticeEvent[];
  defaultEvents: MatrixNoticeEvent[];
}

export interface ConnectMatrixBotRequest {
  userId: string;
  password?: string;
  accessToken?: string;
  homeserverUrl?: string;
}

export async function getMatrixSettings(slug: string): Promise<MatrixSettingsDto> {
  return (await http.get<MatrixSettingsDto>(`/workspaces/${slug}/matrix`)).data;
}

export interface ConnectedMatrixBotDto {
  bot: MatrixBotDto;
  /** When another account replaced the bot: the rooms it got into, and those someone has to invite it to. */
  handOver: { moved: number; notMoved: { roomId: string; error: string }[] } | null;
}

export async function connectMatrixBot(slug: string, body: ConnectMatrixBotRequest): Promise<ConnectedMatrixBotDto> {
  return (await http.post<ConnectedMatrixBotDto>(`/workspaces/${slug}/matrix/bot`, body)).data;
}

export async function disconnectMatrixBot(slug: string): Promise<{ sessionEnded: boolean }> {
  return (await http.delete<{ sessionEnded: boolean }>(`/workspaces/${slug}/matrix/bot`)).data;
}

/** A room for the bot to create: private, invite only, without encryption. */
export interface NewMatrixRoomRequest {
  name: string;
  /** Matrix user IDs (@name:server), invited and made admins of the room. */
  invite: string[];
}

export interface SaveMatrixRoomRequest {
  /** An existing room; or newRoom, for the bot to create one. */
  room?: string;
  newRoom?: NewMatrixRoomRequest;
  scope: MatrixRoomScope;
  scopeId: string | null;
  events: MatrixNoticeEvent[];
  includeText: boolean;
  includeFiles: boolean;
  onlyTicketsWithoutOtherRoom: boolean;
}

export interface SavedMatrixRoomDto {
  room: MatrixRoomDto;
  /** When the bot created the room: who it could not invite, and whether they became admins. */
  created: { notInvited: { userId: string; error: string }[]; adminsSet: boolean } | null;
}

/** Adds a room, or edits the one with that ID. */
export async function saveMatrixRoom(slug: string, id: string | null, body: SaveMatrixRoomRequest): Promise<SavedMatrixRoomDto> {
  const res = id
    ? await http.put<SavedMatrixRoomDto>(`/workspaces/${slug}/matrix/rooms/${id}`, body)
    : await http.post<SavedMatrixRoomDto>(`/workspaces/${slug}/matrix/rooms`, body);
  return res.data;
}

/** What a room is, as the bot sees it once inside. */
export interface MatrixRoomCheckDto {
  roomId: string;
  name: string | null;
  alias: string | null;
  members: number | null;
}

/** The bot joins the room typed (accepting the invitation) and tells what it is; nothing is saved. */
export async function checkMatrixRoom(slug: string, room: string): Promise<MatrixRoomCheckDto> {
  return (await http.post<{ check: MatrixRoomCheckDto }>(`/workspaces/${slug}/matrix/rooms/check`, { room })).data.check;
}

/** A saved room as the bot sees it now, without entering it: inRoom false when it was taken out. */
export interface MatrixRoomStatusDto extends MatrixRoomCheckDto {
  inRoom: boolean;
}

export async function getMatrixRoomStatus(slug: string, id: string): Promise<MatrixRoomStatusDto> {
  return (await http.get<{ status: MatrixRoomStatusDto }>(`/workspaces/${slug}/matrix/rooms/${id}/status`, { headers: { "X-Silent-Errors": "true" } })).data.status;
}

/** The bot leaves a room it joined only to check it, unless it writes there; never fails. */
export async function leaveCheckedMatrixRoom(slug: string, room: string): Promise<void> {
  await http.post(`/workspaces/${slug}/matrix/rooms/check/leave`, { room }, { headers: { "X-Silent-Errors": "true" } }).catch(() => undefined);
}

/** Stops a room's notices; with botLeaves, the bot also says goodbye and leaves it. Answers whether it left. */
export async function removeMatrixRoom(slug: string, id: string, botLeaves: boolean): Promise<{ left: boolean; error: string | null } | null> {
  const res = await http.delete<{ left: { left: boolean; error: string | null } | null }>(`/workspaces/${slug}/matrix/rooms/${id}`, { params: botLeaves ? { botLeaves: true } : {} });
  return res.data.left;
}

/** Stops the room's notices until a test notice reaches it. */
export async function pauseMatrixRoom(slug: string, id: string): Promise<MatrixRoomDto> {
  return (await http.post<{ room: MatrixRoomDto }>(`/workspaces/${slug}/matrix/rooms/${id}/pause`)).data.room;
}

/** Sends a test notice; a paused room is resumed when it arrives. */
export async function testMatrixRoom(slug: string, id: string): Promise<{ success: boolean; error?: string; room: MatrixRoomDto }> {
  return (await http.post<{ success: boolean; error?: string; room: MatrixRoomDto }>(`/workspaces/${slug}/matrix/rooms/${id}/test`)).data;
}

export async function getSystemMatrixBot(): Promise<MatrixBotDto | null> {
  return (await http.get<{ bot: MatrixBotDto | null }>(`/system/matrix`)).data.bot;
}

export async function connectSystemMatrixBot(body: ConnectMatrixBotRequest): Promise<ConnectedMatrixBotDto> {
  return (await http.post<ConnectedMatrixBotDto>(`/system/matrix/bot`, body)).data;
}

export async function disconnectSystemMatrixBot(): Promise<{ sessionEnded: boolean }> {
  return (await http.delete<{ sessionEnded: boolean }>(`/system/matrix/bot`)).data;
}
