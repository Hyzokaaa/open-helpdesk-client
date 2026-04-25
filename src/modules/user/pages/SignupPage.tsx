import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { signup, getProfile } from "../services/auth.service";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import { APP_NAME } from "@modules/app/domain/constants/env";

export default function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signup({ email, password, firstName, lastName, workspaceName });
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
            {APP_NAME}
          </h1>
          <p className="text-sm text-muted mb-6">{t("signup.subtitle")}</p>

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
                onChange={setEmail}
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

            <FormInput label={t("signup.workspaceName")} required>
              <Input
                placeholder={t("signup.workspacePlaceholder")}
                value={workspaceName}
                onChange={setWorkspaceName}
              />
            </FormInput>

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
