import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import { clearSession, saveSession } from "@modules/app/domain/core/session";
import { exchangeOAuthCode, getProfile } from "../services/auth.service";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();
  const { t } = useTranslation();
  // The code is single-use in practice; React's dev double effect must not spend it twice
  const exchanged = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error(t("login.oauthFailed"));
      navigate("/login", { replace: true });
      return;
    }

    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    if (exchanged.current) return;
    exchanged.current = true;

    const fail = () => {
      clearSession();
      toast.error(t("login.oauthFailed"));
      navigate("/login", { replace: true });
    };

    const rememberMe = LocalStorage.get(LOCAL_STORAGE_KEY.OAUTH_REMEMBER_ME) === "1";
    LocalStorage.remove(LOCAL_STORAGE_KEY.OAUTH_REMEMBER_ME);

    exchangeOAuthCode(code, rememberMe)
      .then((tokens) => {
        LocalStorage.set(LOCAL_STORAGE_KEY.LOGIN_REMEMBER_CHOICE, rememberMe ? "1" : "0");
        saveSession(tokens, { remember: rememberMe });

        if (window.opener) {
          window.opener.postMessage("oauth:success", window.location.origin);
          window.close();
          return;
        }

        return getProfile().then((profile) => {
          setUser(profile);
          navigate("/dashboard", { replace: true });
        });
      })
      .catch(fail);
  }, [searchParams, navigate, setUser, t]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="text-muted text-sm">{t("login.authenticating")}</div>
    </div>
  );
}
