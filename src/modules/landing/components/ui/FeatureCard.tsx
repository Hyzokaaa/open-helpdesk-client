import clsx from "clsx";
import useInView from "../../hooks/useInView";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon, title, description, delay = 0 }: Props) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={clsx(
        "group p-6 rounded-2xl border border-border-input bg-surface hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1",
        "animate-fade-up",
        inView && "in-view",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-heading font-body-semibold text-base mb-2">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}
