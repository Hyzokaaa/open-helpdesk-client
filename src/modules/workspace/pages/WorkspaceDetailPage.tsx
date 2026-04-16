import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { WorkspaceDetail, getWorkspace } from "../services/workspace.service";

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId)
      .then(setWorkspace)
      .catch(() => toast.error("Workspace not found"))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner width={24} />
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="w-full">
      <h2 className="text-lg font-body-bold text-gray-800 mb-6">
        {workspace.name}
      </h2>

      <Card className="p-5 mb-4">
        <p className="text-sm text-gray-600">
          {workspace.description || "No description"}
        </p>
        {workspace.dealerId && (
          <p className="text-xs text-gray-400 mt-2">
            Dealer ID: {workspace.dealerId}
          </p>
        )}
      </Card>

      <div className="flex gap-3">
        <Button
          size="sm"
          onClick={() =>
            navigate(`/dashboard/workspaces/${workspaceId}/tickets`)
          }
        >
          Tickets
        </Button>
        <Button
          size="sm"
          color="light"
          onClick={() =>
            navigate(`/dashboard/workspaces/${workspaceId}/members`)
          }
        >
          Members
        </Button>
        <Button
          size="sm"
          color="light"
          onClick={() =>
            navigate(`/dashboard/workspaces/${workspaceId}/tags`)
          }
        >
          Tags
        </Button>
      </div>
    </div>
  );
}
