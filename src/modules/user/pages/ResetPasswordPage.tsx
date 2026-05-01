import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { resetPassword } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import { APP_FULL_NAME } from "@modules/app/domain/constants/env";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordValid = newPassword.length >= 6 && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !passwordValid) return;
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch {
      toast.error(t("reset.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-page">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-card border-card p-8 text-center">
            <p className="text-sm text-body mb-4">{t("reset.invalidToken")}</p>
            <Link to="/login" className="text-xs text-primary hover:underline">
              {t("forgot.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-card border-card p-8">
          <h1 className="text-xl font-body-bold text-heading mb-1">
            {APP_FULL_NAME}
          </h1>
          <p className="text-sm text-muted mb-6">{t("reset.subtitle")}</p>

          {done ? (
            <div>
              <p className="text-sm text-body mb-4">{t("reset.success")}</p>
              <Link to="/login" className="text-xs text-primary hover:underline">
                {t("forgot.backToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <FormInput label={t("settings.newPassword")} required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={setNewPassword}
                />
              </FormInput>

              <FormInput label={t("settings.confirmPassword")} required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </FormInput>

              {passwordMismatch && (
                <p className="text-xs text-red-500 mb-2">{t("settings.passwordMismatch")}</p>
              )}

              <Button type="submit" full loading={loading} className="mt-2" disabled={!passwordValid}>
                {t("reset.submit")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
