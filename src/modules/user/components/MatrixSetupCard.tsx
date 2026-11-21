import { Link } from "react-router";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";
import { MatrixSetupDto } from "@modules/notification/services/matrix-account.service";

interface Props {
  setup: MatrixSetupDto;
}

/**
 * Shown to the team when no bot can write to them yet: personal notices on Matrix exist, and this is
 * what is missing. It links to where the user can connect a bot themselves, or says whom to ask.
 */
export default function MatrixSetupCard({ setup }: Props) {
  const { t } = useTranslation();
  const canConnect = setup.installation || setup.workspaces.length > 0;
  const linkClass = "text-xs text-primary hover:underline font-body-medium";

  return (
    <Card className="p-5 mb-4">
      <h2 className="text-sm font-body-semibold text-heading mb-2">{t("matrixAccount.title")}</h2>
      <p className="text-xs text-body">{t("matrixSetup.missing")}</p>
      {canConnect ? (
        <ul className="mt-3 space-y-1.5">
          {setup.workspaces.map((ws) => (
            <li key={ws.slug}>
              <Link to={`/dashboard/workspaces/${ws.slug}/settings/matrix`} className={linkClass}>
                {t("matrixSetup.connectWorkspace").replace("{workspace}", ws.name)}
              </Link>
            </li>
          ))}
          {setup.installation && (
            <li>
              <Link to="/dashboard/admin/settings/matrix" className={linkClass}>{t("matrixSetup.connectInstallation")}</Link>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-xs text-muted mt-2">{t("matrixSetup.askAdmin")}</p>
      )}
    </Card>
  );
}
