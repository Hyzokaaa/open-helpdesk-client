import useTranslation from "../../i18n/useTranslation";
import { CONFIG } from "../../config";
import Container from "../ui/Container";
import Button from "../ui/Button";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-dvh flex items-center pt-16 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary-200/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary-300/20 rounded-full blur-[100px]" />
      </div>

      <Container className="relative z-10 grid md:grid-cols-2 gap-12 items-center py-20">
        {/* Text */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-body-bold text-heading tracking-tight leading-[1.1]">
            {t("hero.headline")}
          </h1>
          <p className="text-lg text-muted max-w-lg leading-relaxed">
            {t("hero.subheadline")}
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <Button href={CONFIG.APP_URL} size="lg">
              {t("hero.cta")}
            </Button>
            <Button href={CONFIG.GITHUB_URL} variant="outline" size="lg">
              {t("hero.github")}
            </Button>
          </div>
        </div>

        {/* Mockup placeholder */}
        <div className="relative">
          <div className="relative rounded-2xl border border-border-input bg-surface shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Browser toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-input bg-page">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-surface border border-border-input rounded-lg px-3 py-1 text-xs text-muted text-center">
                  app.openhelpdesk.dev
                </div>
              </div>
            </div>
            <img src="/screenshots/hero.png" alt={CONFIG.PRODUCT_NAME} className="w-full" />
          </div>
          {/* Glow */}
          <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
        </div>
      </Container>
    </section>
  );
}
