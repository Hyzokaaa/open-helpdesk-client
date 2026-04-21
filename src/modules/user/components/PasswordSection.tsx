import { useState } from "react";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { changePassword } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function PasswordSection() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const passwordValid = currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async () => {
    if (!passwordValid) return;
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("settings.passwordUpdated"));
    } catch {
      toast.error(t("settings.passwordError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <Card className="p-5">
        <p className="text-sm font-body-semibold text-heading mb-1">
          {t("settings.security")}
        </p>
        <p className="text-xs text-muted mb-4">{t("settings.password")}</p>

        <div className="space-y-3">
          <FormInput label={t("settings.currentPassword")}>
            <Input
              value={currentPassword}
              onChange={setCurrentPassword}
              size="sm"
              type="password"
            />
          </FormInput>
          <FormInput label={t("settings.newPassword")}>
            <Input
              value={newPassword}
              onChange={setNewPassword}
              size="sm"
              type="password"
            />
          </FormInput>
          <FormInput label={t("settings.confirmPassword")}>
            <Input
              value={confirmPassword}
              onChange={setConfirmPassword}
              size="sm"
              type="password"
            />
          </FormInput>
        </div>

        {passwordMismatch && (
          <p className="text-xs text-red-500 mt-2">{t("settings.passwordMismatch")}</p>
        )}

        <div className="mt-4">
          <Button
            size="xs"
            color="primary"
            onClick={handleSubmit}
            disabled={!passwordValid}
            loading={saving}
          >
            {t("settings.changePassword")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
