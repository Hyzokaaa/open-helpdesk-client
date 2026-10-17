import { useState } from "react";
import useUser from "@modules/user/hooks/useUser";
import usePermissions from "./usePermissions";
import { addMember, changeMemberRole } from "../services/workspace.service";
import { notifyMembershipChanged } from "../domain/membership-events";

const TEAM_ROLES = ["admin", "agent"];

/**
 * A system admin can see any workspace without being on its team, but then cannot be
 * assigned, mentioned, followed or added to departments, and misses the admin notifications.
 * `needsJoin` says when to tell them; `join` makes them an admin of the workspace.
 */
export default function useWorkspaceMembership(workspaceSlug: string | undefined) {
  const { user } = useUser();
  const { role, loading } = usePermissions(workspaceSlug);
  const [joining, setJoining] = useState(false);
  const [failed, setFailed] = useState(false);

  const needsJoin = !!user?.isSystemAdmin && !!workspaceSlug && !loading && !TEAM_ROLES.includes(role ?? "");
  // Already in the workspace as a customer: the role is changed instead of adding them again
  const isUserRole = role === "user";

  const join = async (): Promise<boolean> => {
    if (!user || !workspaceSlug || joining) return false;
    setJoining(true);
    setFailed(false);
    try {
      if (isUserRole) await changeMemberRole(workspaceSlug, user.id, "admin");
      else await addMember(workspaceSlug, { userId: user.id, role: "admin" });
      notifyMembershipChanged(workspaceSlug);
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      setJoining(false);
    }
  };

  return { needsJoin, isUserRole, joining, failed, join };
}
