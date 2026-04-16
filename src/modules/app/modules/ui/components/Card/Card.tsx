import clsx from "clsx";

interface Props {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function Card({ children, className, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-card border-card w-full",
        "transition-all duration-200",
        { "border-card-effect cursor-pointer": onClick !== undefined },
        className,
      )}
    >
      {children}
    </div>
  );
}
