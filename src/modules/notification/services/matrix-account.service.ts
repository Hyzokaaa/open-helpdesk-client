import { http } from "@modules/app/modules/http/domain/http";

export type MatrixAccountStatus = "pending" | "verified";

export interface MatrixAccountDto {
  matrixUserId: string;
  /** pending: the code was sent; verified: notices go there. */
  status: MatrixAccountStatus;
  codeExpiresAt: string | null;
  /** A new ID being verified; until then the notices go on reaching matrixUserId. */
  pendingMatrixUserId: string | null;
}

/** A bot that may write to the user, in its own chat. */
export interface MatrixChatDto {
  botId: string;
  botUserId: string;
  /** The user's workspaces it writes for. */
  workspaces: string[];
  /** The user left or rejected this bot's chat: its notices wait until they reconnect it. */
  paused: boolean;
}

/** Where a team member with no bot to write to them could get one. */
export interface MatrixSetupDto {
  /** Their workspaces where they may connect a bot themselves. */
  workspaces: { slug: string; name: string }[];
  /** A system admin may connect the installation's bot. */
  installation: boolean;
}

export interface MyMatrixDto {
  /** Whether one of the user's workspaces can write on Matrix. */
  available: boolean;
  /** The bot that sends the code, whose invitation the user is to accept first. */
  botUserId: string | null;
  identity: MatrixAccountDto | null;
  chats: MatrixChatDto[];
  /** With no bot for the user: what is missing. Null when there is one, for a customer, and from older servers. */
  setup?: MatrixSetupDto | null;
}

export async function getMyMatrix(): Promise<MyMatrixDto> {
  return (await http.get<MyMatrixDto>("/matrix/me")).data;
}

/** The bot opens a direct chat with that account and sends a six-digit code there. */
export async function sendMatrixCode(matrixUserId: string): Promise<MatrixAccountDto> {
  return (await http.post<MatrixAccountDto>("/matrix/me", { matrixUserId })).data;
}

export async function verifyMatrixCode(code: string): Promise<MatrixAccountDto> {
  return (await http.post<MatrixAccountDto>("/matrix/me/verify", { code })).data;
}

/** After the user left one bot's chat: that bot invites them to a new one. */
export async function reconnectMatrixChat(botId: string): Promise<void> {
  await http.post(`/matrix/me/chats/${encodeURIComponent(botId)}/reconnect`);
}

/** Gives up the new ID being verified; the verified one goes on. */
export async function cancelMatrixChange(): Promise<MatrixAccountDto | null> {
  return (await http.delete<MatrixAccountDto | null>("/matrix/me/pending")).data || null;
}

export async function disconnectMatrix(): Promise<void> {
  await http.delete("/matrix/me");
}
