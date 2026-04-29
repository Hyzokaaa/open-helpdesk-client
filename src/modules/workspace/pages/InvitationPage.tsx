import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  InvitationDetail,
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
} from "../services/invitation.service";

export default function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useUser();
  const { t, tEnum } = useTranslation();
  const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!token) return;
    getInvitationByToken(token)
      .then(setInvitation)
      .catch(() => setInvitation(null))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setActing(true);
    try {
      const result = await acceptInvitation(token);
      toast.success(t("invitations.accepted"));
      navigate(`/dashboard`);
    } catch {
      toast.error(t("invitations.acceptError"));
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    setActing(true);
    try {
      await rejectInvitation(token);
      toast.success(t("invitations.rejected"));
      navigate("/dashboard");
    } catch {
      toast.error(t("invitations.rejectError"));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner width={24} /></div>;

  if (!invitation) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-page">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-body-bold text-heading mb-2">{t("invitations.invalidTitle")}</h2>
          <p className="text-sm text-muted mb-4">{t("invitations.invalidMessage")}</p>
          <Button size="sm" onClick={() => navigate("/login")}>{t("invitations.goToLogin")}</Button>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isPending = invitation.status === "pending" && !isExpired;
  const returnUrl = `/invite/${token}`;

  if (!user) {
    const target = invitation.accountExists ? "/login" : "/signup";
    navigate(`${target}?redirect=${encodeURIComponent(returnUrl)}`);
    return null;
  }

  if (user.email !== invitation.email) {
    signOut();
    const target = invitation.accountExists ? "/login" : "/signup";
    navigate(`${target}?redirect=${encodeURIComponent(returnUrl)}`);
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-page">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-lg font-body-bold text-heading mb-2">{t("invitations.title")}</h2>
          <p className="text-sm text-muted">
            {t("invitations.youveBeenInvited")}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("invitations.workspace")}</span>
            <span className="text-sm font-body-semibold text-heading">{invitation.workspaceName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("members.role")}</span>
            <StatusBadge
              label={tEnum("role", invitation.role)}
              color={invitation.role === "admin" ? "primary" : invitation.role === "agent" ? "blue" : "gray"}
              size="xs"
            />
          </div>
          {!isPending && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">{t("invitations.status")}</span>
              <StatusBadge
                label={isExpired ? t("invitations.expired") : invitation.status}
                color={isExpired ? "gray" : "primary"}
                size="xs"
              />
            </div>
          )}
        </div>

        {isPending ? (
          <div className="flex gap-3">
            <Button size="sm" full onClick={handleAccept} loading={acting}>
              {t("invitations.accept")}
            </Button>
            <Button size="sm" color="light" full onClick={handleReject} loading={acting}>
              {t("invitations.reject")}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted mb-4">
              {isExpired ? t("invitations.expiredMessage") : t("invitations.alreadyHandled")}
            </p>
            <Button size="sm" color="light" onClick={() => navigate("/dashboard")}>
              {t("invitations.goToDashboard")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
