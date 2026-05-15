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
  RolesIcon,
  EmailIcon,
  AttachmentsIcon,
  TagsIcon,
} from "../icons/FeatureIcons";

export default function Features() {
  const { t } = useTranslation();

  const features = [
    { icon: <TicketIcon />, title: t("features.tickets.title"), desc: t("features.tickets.desc") },
    { icon: <ReportsIcon />, title: t("features.reports.title"), desc: t("features.reports.desc") },
    { icon: <CsatIcon />, title: t("features.csat.title"), desc: t("features.csat.desc") },
    { icon: <CannedIcon />, title: t("features.canned.title"), desc: t("features.canned.desc") },
    { icon: <CustomFieldsIcon />, title: t("features.customFields.title"), desc: t("features.customFields.desc") },
    { icon: <RolesIcon />, title: t("features.roles.title"), desc: t("features.roles.desc") },
    { icon: <EmailIcon />, title: t("features.email.title"), desc: t("features.email.desc") },
    { icon: <AttachmentsIcon />, title: t("features.attachments.title"), desc: t("features.attachments.desc") },
    { icon: <TagsIcon />, title: t("features.tags.title"), desc: t("features.tags.desc") },
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
