import { useState } from "react";
import { Link } from "react-router";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { forgotPassword } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import { APP_NAME } from "@modules/app/domain/constants/env";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setSent(true);
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
          <p className="text-sm text-muted mb-6">{t("forgot.subtitle")}</p>

          {sent ? (
            <div>
              <p className="text-sm text-body mb-4">{t("forgot.sent")}</p>
              <Link to="/login" className="text-xs text-primary hover:underline">
                {t("forgot.backToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <FormInput label={t("login.email")} required>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={setEmail}
                />
              </FormInput>

              <Button type="submit" full loading={loading} className="mt-2" disabled={!email}>
                {t("forgot.submit")}
              </Button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-xs text-primary hover:underline">
                  {t("forgot.backToLogin")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
