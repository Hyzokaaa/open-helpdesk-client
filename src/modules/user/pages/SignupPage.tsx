import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { signup, getProfile, getAuthProviders } from "../services/auth.service";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import { APP_FULL_NAME } from "@modules/app/domain/constants/env";
import OAuthButtons from "../components/OAuthButtons";

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();
  const { t } = useTranslation();
  const { saasMode } = useConfig();

  const inviteEmail = searchParams.get("email") || "";
  const redirect = searchParams.get("redirect") || "";
  const invitationToken = redirect.startsWith("/invite/") ? redirect.replace("/invite/", "") : "";
  const isInviteFlow = !!inviteEmail && !!invitationToken;
  const planParam = searchParams.get("plan") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; microsoft: boolean }>({ google: false, microsoft: false });

  useEffect(() => {
    getAuthProviders().then(setProviders).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isInviteFlow) {
      if (saasMode) {
        const onboardingUrl = planParam ? `/onboarding?plan=${planParam}` : "/onboarding";
        navigate(onboardingUrl, { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [isInviteFlow, saasMode, planParam, navigate]);

  if (!isInviteFlow) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signup({
        email, password, firstName, lastName,
        ...(isInviteFlow ? { invitationToken } : { workspaceName }),
      });
      LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, res.accessToken);

      const profile = await getProfile();
      setUser(profile);

      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t("signup.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-card border-card p-8">
          <h1 className="text-xl font-body-bold text-heading mb-1">
            {APP_FULL_NAME}
          </h1>
          <p className="text-sm text-muted mb-6">{t("signup.subtitle")}</p>

          {!isInviteFlow && <OAuthButtons providers={providers} onSuccess={async () => {
            const profile = await getProfile();
            setUser(profile);
            navigate("/onboarding?step=3", { replace: true });
          }} />}

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <FormInput label={t("signup.firstName")} required>
                <Input
                  value={firstName}
                  onChange={setFirstName}
                />
              </FormInput>

              <FormInput label={t("signup.lastName")} required>
                <Input
                  value={lastName}
                  onChange={setLastName}
                />
              </FormInput>
            </div>

            <FormInput label={t("signup.email")} required>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={isInviteFlow ? () => {} : setEmail}
                disabled={isInviteFlow}
              />
            </FormInput>

            <FormInput label={t("signup.password")} required>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
              />
            </FormInput>

            {!isInviteFlow && (
              <FormInput label={t("signup.workspaceName")} required>
                <Input
                  placeholder={t("signup.workspacePlaceholder")}
                  value={workspaceName}
                  onChange={setWorkspaceName}
                />
              </FormInput>
            )}

            <Button type="submit" full loading={loading} className="mt-2">
              {t("signup.submit")}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Link to="/login" className="text-xs text-primary hover:underline">
              {t("signup.hasAccount")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
