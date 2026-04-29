import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { login, getProfile } from "../services/auth.service";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import LanguageToggle from "@modules/app/components/LanguageToggle";
import { APP_NAME } from "@modules/app/domain/constants/env";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();
  const { t } = useTranslation();
  const { saasMode } = useConfig();

  const inviteEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-card border-card p-8">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-xl font-body-bold text-heading">
              {APP_NAME}
            </h1>
            <LanguageToggle />
          </div>
          <p className="text-sm text-muted mb-6">
            {inviteEmail ? t("login.inviteHint").replace("{email}", inviteEmail) : t("login.subtitle")}
          </p>

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
            {saasMode && (
              <Link to="/signup" className="text-xs text-primary hover:underline">
                {t("login.noAccount")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
