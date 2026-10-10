import clsx from "clsx";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";

interface Props {
  /** Fills the whole viewport; otherwise it fills the space of the container it is placed in. */
  fullScreen?: boolean;
}

export default function PageLoader({ fullScreen = true }: Props) {
  return (
    <div className={clsx("w-full flex justify-center items-center", fullScreen ? "h-dvh" : "grow py-24")}>
      <Spinner width={32} />
    </div>
  );
}
