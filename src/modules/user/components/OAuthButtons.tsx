import useTranslation from "@modules/app/i18n/useTranslation";
import { API_URL } from "@modules/app/domain/constants/env";
import type { AuthProviders } from "../services/auth.service";

interface Props {
  providers: AuthProviders;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

export default function OAuthButtons({ providers, onSuccess }: Props & { onSuccess?: () => void }) {
  const { t } = useTranslation();

  const hasAny = providers.google || providers.microsoft;
  if (!hasAny) return null;

  const openPopup = (provider: string) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      `${API_URL}/auth/${provider}?redirect=${encodeURIComponent(window.location.origin)}`,
      `oauth-${provider}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
    );

    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "oauth:success") {
        window.removeEventListener("message", handler);
        onSuccess?.();
      }
    };
    window.addEventListener("message", handler);
  };

  return (
    <>
      <div className="flex flex-col gap-2 mb-4">
        {providers.google && (
          <button
            type="button"
            onClick={() => openPopup("google")}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-card rounded-lg text-sm text-heading bg-surface hover:bg-page transition-colors cursor-pointer"
          >
            <GoogleIcon />
            {t("login.withGoogle")}
          </button>
        )}
        {providers.microsoft && (
          <button
            type="button"
            onClick={() => openPopup("microsoft")}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-card rounded-lg text-sm text-heading bg-surface hover:bg-page transition-colors cursor-pointer"
          >
            <MicrosoftIcon />
            {t("login.withMicrosoft")}
          </button>
        )}
      </div>
      <div className="relative flex items-center mb-4">
        <div className="flex-1 border-t border-card" />
        <span className="px-3 text-xs text-muted">{t("login.orDivider")}</span>
        <div className="flex-1 border-t border-card" />
      </div>
    </>
  );
}
