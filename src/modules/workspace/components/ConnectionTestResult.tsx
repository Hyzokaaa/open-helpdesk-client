import useTranslation from "@modules/app/i18n/useTranslation";
import { TranslationKey } from "@modules/app/i18n/translations";

/** What the backend says went wrong when connecting to a mail server (`connectionErrorKind`). */
export type ConnectionErrorCode =
  | "auth-failed"
  | "tls-mismatch"
  | "tls-required"
  | "wrong-port"
  | "host-not-found"
  | "refused"
  | "timeout"
  | "certificate"
  | "unknown";

export interface ConnectionTestOutcome {
  success: boolean;
  error?: string;
  errorCode?: ConnectionErrorCode;
}

interface Props {
  result: ConnectionTestOutcome;
  protocol: "imap";
  host: string;
  port: string | number;
  successText: string;
  failedText: string;
}

/**
 * The outcome of a connection test: a plain explanation of what to change, with the server's own
 * words underneath for whoever has to look further.
 */
export default function ConnectionTestResult({ result, protocol, host, port, successText, failedText }: Props) {
  const { t } = useTranslation();

  if (result.success) {
    return <span className="text-xs font-body-medium text-green-600">{successText}</span>;
  }

  const explained = result.errorCode && result.errorCode !== "unknown"
    ? t(`connectionError.${protocol}.${result.errorCode}` as TranslationKey)
        .replace("{host}", host.trim())
        .replace("{port}", String(port).trim())
    : null;

  return (
    <span className="text-xs font-body-medium text-red-500 min-w-0">
      {explained ?? result.error ?? failedText}
      {explained && result.error && (
        <span className="block text-muted font-body mt-0.5 break-words">
          {t("connectionError.detail")}: {result.error}
        </span>
      )}
    </span>
  );
}
