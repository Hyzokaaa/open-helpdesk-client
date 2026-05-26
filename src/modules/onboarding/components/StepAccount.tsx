import { useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { signup, getProfile } from "@modules/user/services/auth.service";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  onDone: () => void;
}

export default function StepAccount({ onDone }: Props) {
  const { setUser } = useUser();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t("onboarding.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("onboarding.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const res = await signup({ email, password, firstName, lastName });
      LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, res.accessToken);
      const profile = await getProfile();
      setUser(profile);
      onDone();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || t("signup.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-card border-card p-8">
      <h2 className="text-lg font-body-bold text-heading mb-1">{t("onboarding.createAccount")}</h2>
      <p className="text-sm text-muted mb-6">{t("onboarding.createAccountDesc")}</p>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <FormInput label={t("signup.firstName")} required>
            <Input value={firstName} onChange={setFirstName} />
          </FormInput>
          <FormInput label={t("signup.lastName")} required>
            <Input value={lastName} onChange={setLastName} />
          </FormInput>
        </div>

        <FormInput label={t("signup.email")} required>
          <Input type="email" placeholder="email@example.com" value={email} onChange={setEmail} />
        </FormInput>

        <FormInput label={t("signup.password")} required>
          <Input type="password" placeholder="••••••••" value={password} onChange={setPassword} />
        </FormInput>

        <FormInput label={t("onboarding.confirmPassword")} required>
          <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={setConfirmPassword} />
        </FormInput>

        <Button type="submit" full loading={loading} className="mt-2">
          {t("onboarding.continue")}
        </Button>
      </form>

      <p className="text-center text-xs text-muted mt-4">
        {t("onboarding.alreadyHaveAccount")}{" "}
        <Link to="/login" className="text-primary hover:underline">{t("onboarding.loginLink")}</Link>
      </p>
    </div>
  );
}
