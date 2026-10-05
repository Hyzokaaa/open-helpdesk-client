import type { PersonSummary } from "@modules/shared/domain/person-summary";

interface NamedPerson {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface PeopleSources {
  ticket?: {
    reporter?: PersonSummary | null;
    assignee?: PersonSummary | null;
    registeredBy?: PersonSummary | null;
    resolvedBy?: PersonSummary | null;
  } | null;
  comments?: { author?: PersonSummary | null }[];
}

/**
 * Names the ticket response carries for the people involved in it. Members who
 * cannot list the workspace members (the USER role) rely on these alone.
 */
export function collectTicketPeople({ ticket, comments = [] }: PeopleSources): Map<string, PersonSummary> {
  const people = new Map<string, PersonSummary>();
  const add = (p?: PersonSummary | null) => { if (p) people.set(p.id, p); };
  add(ticket?.reporter);
  add(ticket?.assignee);
  add(ticket?.registeredBy);
  add(ticket?.resolvedBy);
  comments.forEach((c) => add(c.author));
  return people;
}

/** The member entry wins (it has the avatar); the ticket's own names are the fallback. */
export function findPerson(
  userId: string,
  members: ({ userId: string } & NamedPerson)[],
  people: Map<string, PersonSummary>,
): NamedPerson | undefined {
  return members.find((m) => m.userId === userId) ?? people.get(userId);
}
