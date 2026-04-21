import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import useUser from "../hooks/useUser";
import { updateName } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function AccountSection() {
  const { user, setUser } = useUser();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  if (!user) return null;

  const nameChanged = firstName !== user.firstName || lastName !== user.lastName;
  const nameValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSave = async () => {
    if (!nameValid) return;
    setSaving(true);
    try {
      await updateName(firstName.trim(), lastName.trim());
      setUser({ ...user, firstName: firstName.trim(), lastName: lastName.trim() });
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
    <Card className="p-5">
      <p className="text-sm font-body-semibold text-heading mb-4">
        {t("settings.account")}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <FormInput label={t("settings.firstName")}>
          <Input value={firstName} onChange={setFirstName} size="sm" />
        </FormInput>
        <FormInput label={t("settings.lastName")}>
          <Input value={lastName} onChange={setLastName} size="sm" />
        </FormInput>
      </div>

      {nameChanged && (
        <Button
          size="xs"
          color="primary"
          onClick={handleSave}
          disabled={!nameValid}
          loading={saving}
        >
          {t("settings.save")}
        </Button>
      )}

      <div className="mt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t("settings.email")}</span>
          <span className="text-body font-body-medium">{user.email}</span>
        </div>
      </div>
    </Card>
    </div>
  );
}
