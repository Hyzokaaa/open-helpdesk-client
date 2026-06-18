import useTranslation from "../../i18n/useTranslation";
import { CONFIG } from "../../config";
import type { CompetitorData } from "../../data/competitors";
import Container from "../ui/Container";
import Button from "../ui/Button";

interface Props {
  competitor: CompetitorData;
}

export default function CompareHero({ competitor }: Props) {
  const { t } = useTranslation();

  return (
    <section className="pt-32 pb-16">
      <Container className="text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary text-sm font-body-semibold mb-6">
          Open Helpdesk vs {t(competitor.nameKey)}
        </span>
        <h1 className="text-4xl md:text-5xl font-body-bold text-heading tracking-tight mb-4 max-w-3xl mx-auto">
          {t(competitor.headlineKey)}
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
          {t(competitor.subtitleKey)}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href={CONFIG.APP_URL} size="lg">
            {t("compare.cta.tryFree")}
          </Button>
          <Button href={CONFIG.GITHUB_URL} variant="outline" size="lg">
            {t("compare.cta.viewGithub")}
          </Button>
        </div>
      </Container>
    </section>
  );
}
