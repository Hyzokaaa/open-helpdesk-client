import useTranslation from "../../i18n/useTranslation";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import FeatureCard from "../ui/FeatureCard";
import {
  TicketIcon,
  ReportsIcon,
  CsatIcon,
  CannedIcon,
  CustomFieldsIcon,
  WorkspacesIcon,
  AuditLogIcon,
  SelfHostedIcon,
  ApiIcon,
} from "../icons/FeatureIcons";

export default function Features() {
  const { t } = useTranslation();

  const features = [
    { icon: <TicketIcon />, title: t("features.tickets.title"), desc: t("features.tickets.desc") },
    { icon: <ReportsIcon />, title: t("features.reports.title"), desc: t("features.reports.desc") },
    { icon: <CsatIcon />, title: t("features.csat.title"), desc: t("features.csat.desc") },
    { icon: <CannedIcon />, title: t("features.canned.title"), desc: t("features.canned.desc") },
    { icon: <CustomFieldsIcon />, title: t("features.customFields.title"), desc: t("features.customFields.desc") },
    { icon: <WorkspacesIcon />, title: t("features.workspaces.title"), desc: t("features.workspaces.desc") },
    { icon: <AuditLogIcon />, title: t("features.auditLog.title"), desc: t("features.auditLog.desc") },
    { icon: <SelfHostedIcon />, title: t("features.selfHosted.title"), desc: t("features.selfHosted.desc") },
    { icon: <ApiIcon />, title: t("features.api.title"), desc: t("features.api.desc") },
  ];

  return (
    <section id="features" className="py-24 bg-page">
      <Container>
        <SectionHeading title={t("features.heading")} subtitle={t("features.subheading")} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.desc} delay={i * 80} />
          ))}
        </div>
      </Container>
    </section>
  );
}
