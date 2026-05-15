import useTranslation from "../../i18n/useTranslation";
import { CONFIG } from "../../config";
import Container from "../ui/Container";
import Button from "../ui/Button";

export default function CTAFooter() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-primary-50">
      <Container className="text-center">
        <h2 className="text-3xl md:text-4xl font-body-bold text-heading tracking-tight mb-4">
          {t("cta.heading")}
        </h2>
        <p className="text-lg text-muted mb-8 max-w-lg mx-auto">
          {t("cta.subheading")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href={CONFIG.APP_URL} size="lg">
            {t("cta.getStarted")}
          </Button>
          <Button
            href={`mailto:${CONFIG.CONTACT_EMAIL}`}
            variant="outline"
            size="lg"
          >
            {t("cta.talkToUs")}
          </Button>
        </div>
      </Container>
    </section>
  );
}
