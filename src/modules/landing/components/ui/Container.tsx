import clsx from "clsx";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function Container({ children, className }: Props) {
  return (
    <div className={clsx("w-full max-w-6xl mx-auto px-6 md:px-8", className)}>
      {children}
    </div>
  );
}
