import useTranslation from "../../i18n/useTranslation";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import useInView from "../../hooks/useInView";
import clsx from "clsx";

export default function Problem() {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const problems = [
    { title: t("problem.p1.title"), desc: t("problem.p1.desc"), icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
    { title: t("problem.p2.title"), desc: t("problem.p2.desc"), icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { title: t("problem.p3.title"), desc: t("problem.p3.desc"), icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <section className="py-24 bg-page">
      <Container>
        <SectionHeading title={t("problem.heading")} />

        <div
          ref={ref}
          className={clsx("grid md:grid-cols-3 gap-8 mt-12 animate-fade-up", inView && "in-view")}
        >
          {problems.map((p) => (
            <div key={p.title} className="flex flex-col gap-4 p-6 rounded-2xl border border-red-200 bg-red-50/50">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                </svg>
              </div>
              <h3 className="text-heading font-body-semibold text-base">{p.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
