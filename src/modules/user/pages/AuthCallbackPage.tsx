import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import { getProfile } from "../services/auth.service";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();
  const { t } = useTranslation();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error(t("login.oauthFailed"));
      navigate("/login", { replace: true });
      return;
    }

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, token);

    if (window.opener) {
      window.opener.postMessage("oauth:success", "*");
      window.close();
      return;
    }

    getProfile()
      .then((profile) => {
        setUser(profile);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        LocalStorage.remove(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
        toast.error(t("login.oauthFailed"));
        navigate("/login", { replace: true });
      });
  }, [searchParams, navigate, setUser, t]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="text-muted text-sm">{t("login.authenticating")}</div>
    </div>
  );
}
