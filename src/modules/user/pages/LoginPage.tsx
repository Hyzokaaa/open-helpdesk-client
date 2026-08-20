import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { login, getProfile, getAuthProviders } from "../services/auth.service";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import LanguageToggle from "@modules/app/components/LanguageToggle";
import BrandLogo from "@modules/app/components/BrandLogo";
import OAuthButtons from "../components/OAuthButtons";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();
  const { t } = useTranslation();
  const { saasMode, brandName, brandSubtitle, brandLogo, domainWorkspaces } = useConfig();
  const isCustomDomain = !!domainWorkspaces;

  const inviteEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; microsoft: boolean }>({ google: false, microsoft: false });

  useEffect(() => {
    getAuthProviders().then(setProviders).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      toast.error(t("login.oauthFailed"));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login({ email, password });
      LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, res.accessToken);

      const profile = await getProfile();
      setUser(profile);

      navigate(searchParams.get("redirect") || "/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-page">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-card border-card p-8">
            <div className="flex justify-end mb-2">
              <LanguageToggle />
            </div>
            {brandLogo && (
              <div className="flex justify-center mb-4">
                <BrandLogo src={brandLogo} size="xl" />
              </div>
            )}
            <h1 className="text-xl font-body-bold text-heading text-center">
              {brandSubtitle ? `${brandName} ${brandSubtitle}` : brandName}
            </h1>
            <p className="text-sm text-muted mb-6 text-center">
              {inviteEmail ? t("login.inviteHint").replace("{email}", inviteEmail) : t("login.subtitle")}
            </p>

            <OAuthButtons providers={providers} onSuccess={async () => {
              const profile = await getProfile();
              setUser(profile);
              const { listWorkspaces } = await import("@modules/workspace/services/workspace.service");
              const workspaces = await listWorkspaces();
              navigate(workspaces.length === 0 ? "/onboarding?step=3" : "/dashboard", { replace: true });
            }} />

            <form onSubmit={handleSubmit}>
              <FormInput label={t("login.email")} required>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={setEmail}
                />
              </FormInput>

              <FormInput label={t("login.password")} required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                />
              </FormInput>

              <Button type="submit" full loading={loading} className="mt-2">
                {t("login.signIn")}
              </Button>
            </form>

            <div className="text-center mt-4 flex flex-col gap-2">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                {t("login.forgotPassword")}
              </Link>
              {saasMode && !isCustomDomain && (
                <Link to="/signup" className="text-xs text-primary hover:underline">
                  {t("login.noAccount")}
                </Link>
              )}
            </div>
          </div>

          {saasMode && !isCustomDomain && (
            <div className="flex items-center justify-center gap-3 mt-4 text-[11px] text-muted">
              <a href="/terms" className="hover:text-heading transition-colors">{t("legal.terms")}</a>
              <span>·</span>
              <a href="/privacy" className="hover:text-heading transition-colors">{t("legal.privacy")}</a>
              <span>·</span>
              <a href="/refund" className="hover:text-heading transition-colors">{t("legal.refund")}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
