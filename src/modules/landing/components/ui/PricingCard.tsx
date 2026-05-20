import clsx from "clsx";
import Button from "./Button";
import Badge from "./Badge";

interface Props {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href?: string;
  disabled?: boolean;
  highlighted?: boolean;
  badge?: string;
  ctaSubtitle?: string;
}

export default function PricingCard({
  name,
  description,
  price,
  period,
  features,
  cta,
  href,
  disabled,
  highlighted,
  badge,
  ctaSubtitle,
}: Props) {
  return (
    <div
      className={clsx(
        "relative flex flex-col rounded-2xl p-8 transition-all duration-300",
        highlighted
          ? "bg-white border-2 border-primary shadow-xl shadow-primary/10 scale-[1.02]"
          : "bg-surface border border-border-input hover:shadow-lg",
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center">
          <Badge>{badge}</Badge>
        </div>
      )}

      <div className="mb-1 text-center">
        <h3 className="text-heading font-body-bold text-xl">{name}</h3>
        <p className="text-muted text-sm mt-1 min-h-[60px]">{description}</p>
      </div>

      <div className="mb-6 text-center h-12 flex items-center justify-center">
        <span className="text-heading font-body-bold text-4xl">{price}</span>
        {period && <span className="text-muted text-sm ml-1">{period}</span>}
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-body">
            <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="relative">
        <Button
          href={disabled ? undefined : href}
          variant={highlighted ? "primary" : "outline"}
          size="base"
          className={clsx("w-full", disabled && "opacity-50 cursor-not-allowed pointer-events-none")}
        >
          {cta}
        </Button>
        {ctaSubtitle && <p className="absolute w-full text-center text-[11px] text-muted mt-1">{ctaSubtitle}</p>}
      </div>
    </div>
  );
}
