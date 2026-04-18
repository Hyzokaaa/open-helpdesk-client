export const P = {
  WORKSPACE_CREATE: "workspace.create",
  WORKSPACE_MEMBERS_MANAGE: "workspace.members.manage",

  TAG_CREATE: "tag.create",
  TAG_DELETE: "tag.delete",
  TAG_VIEW: "tag.view",

  TICKET_CREATE: "ticket.create",
  TICKET_VIEW: "ticket.view",
  TICKET_EDIT_NAME: "ticket.edit.name",
  TICKET_EDIT_DESCRIPTION: "ticket.edit.description",
  TICKET_EDIT_PRIORITY: "ticket.edit.priority",
  TICKET_EDIT_CATEGORY: "ticket.edit.category",
  TICKET_EDIT_TAGS: "ticket.edit.tags",
  TICKET_CHANGE_STATUS: "ticket.change.status",
  TICKET_CHANGE_STATUS_CLOSED: "ticket.change.status.closed",
  TICKET_ASSIGN: "ticket.assign",
  TICKET_DELETE: "ticket.delete",
  TICKET_EDIT_CLOSED: "ticket.edit.closed",

  COMMENT_CREATE: "comment.create",

  ATTACHMENT_UPLOAD: "attachment.upload",
  ATTACHMENT_DELETE: "attachment.delete",

  USER_CREATE: "user.create",
  USER_LIST: "user.list",
} as const;
