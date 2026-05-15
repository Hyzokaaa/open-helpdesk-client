import useTranslation from "../../i18n/useTranslation";
import { CONFIG } from "../../config";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import { GitHubIcon } from "../icons/SocialIcons";
import useInView from "../../hooks/useInView";
import clsx from "clsx";

export default function OpenSource() {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  return (
    <section id="open-source" className="py-24 bg-page">
      <Container>
        <SectionHeading title={t("oss.heading")} subtitle={t("oss.subheading")} />

        <div
          ref={ref}
          className={clsx("grid md:grid-cols-2 gap-12 items-center animate-fade-up", inView && "in-view")}
        >
          {/* Info */}
          <div className="flex flex-col gap-8">
            {[
              { title: t("oss.agpl.title"), desc: t("oss.agpl.desc") },
              { title: t("oss.selfHost.title"), desc: t("oss.selfHost.desc") },
              { title: t("oss.contribute.title"), desc: t("oss.contribute.desc") },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-heading font-body-semibold text-base mb-2">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
            <div>
              <Button href={CONFIG.GITHUB_URL} variant="outline" className="!border-primary !text-primary hover:!bg-primary-50">
                <span className="flex items-center gap-2">
                  <GitHubIcon />
                  {t("oss.starOnGithub")}
                </span>
              </Button>
            </div>
          </div>

          {/* Terminal */}
          <div className="rounded-2xl border border-primary-800 overflow-hidden bg-primary-950 shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-primary-800 bg-primary-900">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-500 ml-2 font-body-medium">terminal</span>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed">
              <p className="text-gray-500"># Clone the repository</p>
              <p className="text-green-400">$ <span className="text-gray-200">git clone {CONFIG.GITHUB_URL}</span></p>
              <p className="mt-3 text-gray-500"># Start with Docker</p>
              <p className="text-green-400">$ <span className="text-gray-200">cd open-helpdesk</span></p>
              <p className="text-green-400">$ <span className="text-gray-200">docker compose up -d</span></p>
              <p className="mt-3 text-gray-500"># Ready at localhost:3000</p>
              <p className="text-primary">&#10003; Open Helpdesk is running!</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
