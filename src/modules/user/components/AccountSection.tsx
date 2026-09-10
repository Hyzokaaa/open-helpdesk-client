import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import UserAvatar from "./UserAvatar";
import useUser from "../hooks/useUser";
import { updateName, uploadAvatar, deleteAvatar } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function AccountSection() {
  const { user, setUser } = useUser();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { avatarUrl } = await uploadAvatar(file);
      setUser({ ...user, avatarUrl });
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    setUploadingAvatar(true);
    try {
      await deleteAvatar();
      setUser({ ...user, avatarUrl: null });
    } catch {
      toast.error("Failed to delete avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
    <Card className="p-5">
      <p className="text-sm font-body-semibold text-heading mb-4">
        {t("settings.account")}
      </p>

      <div className="flex items-center gap-4 mb-4">
        <UserAvatar avatarUrl={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size="lg" />
        <div className="flex flex-col gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Button
            size="xs"
            color="light"
            onClick={() => fileInputRef.current?.click()}
            loading={uploadingAvatar}
          >
            {user.avatarUrl ? t("settings.changeAvatar") : t("settings.uploadAvatar")}
          </Button>
          {user.avatarUrl && (
            <button
              onClick={handleAvatarDelete}
              className="text-xs text-danger hover:underline cursor-pointer"
              disabled={uploadingAvatar}
            >
              {t("settings.removeAvatar")}
            </button>
          )}
        </div>
      </div>

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
