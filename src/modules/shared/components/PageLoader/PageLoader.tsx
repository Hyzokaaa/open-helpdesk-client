import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";

export default function PageLoader() {
  return (
    <div className="w-full h-dvh flex justify-center items-center">
      <Spinner width={32} />
    </div>
  );
}
