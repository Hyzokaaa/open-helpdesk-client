import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
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

type PageState = "loading" | "invalid" | "redirect" | "prompt" | "accepted" | "expired" | "handled";

export default function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useUser();
  const { t, tEnum } = useTranslation();
  const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [acting, setActing] = useState(false);
  const autoAccepted = useRef(false);

  useEffect(() => {
    if (!token) return;
    getInvitationByToken(token)
      .then((inv) => {
        setInvitation(inv);
        if (!inv) setState("invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  // Handle redirects and auto-accept
  useEffect(() => {
    if (!invitation || state !== "loading") return;

    const isExpired = new Date(invitation.expiresAt) < new Date();
    const isPending = invitation.status === "pending" && !isExpired;

    if (!isPending) {
      setState(isExpired ? "expired" : "handled");
      return;
    }

    // Not authenticated — redirect to login/signup
    if (!user) {
      const target = invitation.accountExists ? "/login" : "/signup";
      const params = new URLSearchParams({
        redirect: `/invite/${token}`,
        email: invitation.email,
      });
      navigate(`${target}?${params.toString()}`);
      setState("redirect");
      return;
    }

    // Wrong account — logout and redirect
    if (user.email !== invitation.email) {
      signOut();
      const target = invitation.accountExists ? "/login" : "/signup";
      const params = new URLSearchParams({
        redirect: `/invite/${token}`,
        email: invitation.email,
      });
      navigate(`${target}?${params.toString()}`);
      setState("redirect");
      return;
    }

    // User is authenticated with correct email
    // If coming from signup, auto-accept
    if (searchParams.get("from") === "signup" && !autoAccepted.current) {
      autoAccepted.current = true;
      acceptInvitation(token!)
        .then(() => setState("accepted"))
        .catch(() => setState("prompt"));
      return;
    }

    // Existing user — show accept/reject prompt
    setState("prompt");
  }, [invitation, user]);

  const handleAccept = async () => {
    if (!token) return;
    setActing(true);
    try {
      await acceptInvitation(token);
      setState("accepted");
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

  if (state === "loading" || state === "redirect") {
    return <div className="flex justify-center items-center min-h-screen bg-page"><Spinner width={24} /></div>;
  }

  if (state === "invalid") {
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

  if (state === "accepted") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-page">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-body-bold text-heading mb-2">{t("invitations.successTitle")}</h2>
          <p className="text-sm text-muted mb-2">
            {t("invitations.successMessage").replace("{workspace}", invitation?.workspaceName ?? "")}
          </p>
          {user && !user.isEmailVerified && (
            <p className="text-xs text-subtle mb-4">{t("invitations.verifyEmailHint")}</p>
          )}
          <div className="flex justify-center">
            <Button size="sm" onClick={() => navigate("/dashboard")}>
              {t("invitations.goToDashboard")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-page">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-lg font-body-bold text-heading mb-2">{t("invitations.title")}</h2>
          <p className="text-sm text-muted">{t("invitations.youveBeenInvited")}</p>
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
        </div>

        {state === "prompt" && (
          <div className="flex gap-3">
            <Button size="sm" full onClick={handleAccept} loading={acting}>
              {t("invitations.accept")}
            </Button>
            <Button size="sm" color="light" full onClick={handleReject} loading={acting}>
              {t("invitations.reject")}
            </Button>
          </div>
        )}

        {(state === "expired" || state === "handled") && (
          <div className="text-center">
            <p className="text-sm text-muted mb-4">
              {state === "expired" ? t("invitations.expiredMessage") : t("invitations.alreadyHandled")}
            </p>
            <div className="flex justify-center">
              <Button size="sm" color="light" onClick={() => navigate("/dashboard")}>
                {t("invitations.goToDashboard")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
