export const P = {
  WORKSPACE_CREATE: "workspace.create",
  WORKSPACE_MEMBERS_MANAGE: "workspace.members.manage",
  WORKSPACE_INVITATIONS_MANAGE: "workspace.invitations.manage",
  WORKSPACE_MEMBERS_VIEW: "workspace.members.view",
  WORKSPACE_SETTINGS_MANAGE: "workspace.settings.manage",

  TAG_CREATE: "tag.create",
  TAG_DELETE: "tag.delete",
  TAG_VIEW: "tag.view",

  TICKET_CREATE: "ticket.create",
  TICKET_VIEW: "ticket.view",
  TICKET_VIEW_OWN: "ticket.view.own",
  TICKET_EDIT_NAME: "ticket.edit.name",
  TICKET_EDIT_DESCRIPTION: "ticket.edit.description",
  TICKET_EDIT_PRIORITY: "ticket.edit.priority",
  TICKET_EDIT_CATEGORY: "ticket.edit.category",
  TICKET_EDIT_TAGS: "ticket.edit.tags",
  TICKET_CHANGE_STATUS: "ticket.change.status",
  TICKET_CHANGE_STATUS_DISCARDED: "ticket.change.status.discarded",
  TICKET_ASSIGN: "ticket.assign",
  TICKET_PICKUP: "ticket.pickup",
  TICKET_TRANSFER: "ticket.transfer",
  TRANSFER_REQUEST_RESPOND: "transfer-request.respond",
  TICKET_DELETE: "ticket.delete",
  TICKET_EDIT_DISCARDED: "ticket.edit.discarded",

  COMMENT_CREATE: "comment.create",

  ATTACHMENT_UPLOAD: "attachment.upload",
  ATTACHMENT_DELETE: "attachment.delete",

  USER_CREATE: "user.create",
  USER_LIST: "user.list",

  CANNED_RESPONSE_CREATE: "canned-response.create",
  CANNED_RESPONSE_EDIT: "canned-response.edit",
  CANNED_RESPONSE_DELETE: "canned-response.delete",
  CANNED_RESPONSE_VIEW: "canned-response.view",

  CUSTOM_FIELD_MANAGE: "custom-field.manage",
  CUSTOM_FIELD_VIEW: "custom-field.view",

  REPORT_VIEW: "report.view",

  AUDIT_LOG_VIEW: "audit-log.view",

  KB_ARTICLE_CREATE: "kb.article.create",
  KB_ARTICLE_EDIT: "kb.article.edit",
  KB_ARTICLE_DELETE: "kb.article.delete",
  KB_ARTICLE_VIEW: "kb.article.view",
  KB_CATEGORY_MANAGE: "kb.category.manage",

  DEPARTMENT_MANAGE: "department.manage",
  DEPARTMENT_VIEW: "department.view",

  ORGANIZATION_MANAGE: "organization.manage",
  ORGANIZATION_VIEW: "organization.view",
} as const;
