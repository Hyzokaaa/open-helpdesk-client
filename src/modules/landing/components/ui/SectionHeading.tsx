import clsx from "clsx";

interface Props {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  dark?: boolean;
}

export default function SectionHeading({ title, subtitle, align = "center", dark }: Props) {
  return (
    <div className={clsx("mb-12", align === "center" && "text-center")}>
      <h2
        className={clsx(
          "text-3xl md:text-4xl font-body-bold tracking-tight",
          dark ? "text-white" : "text-heading",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={clsx(
            "mt-4 text-lg max-w-2xl",
            align === "center" && "mx-auto",
            dark ? "text-gray-400" : "text-muted",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
