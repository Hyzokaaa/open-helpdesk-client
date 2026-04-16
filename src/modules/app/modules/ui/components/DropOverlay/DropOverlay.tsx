interface Props {
  visible: boolean;
}

export default function DropOverlay({ visible }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none">
      <div className="bg-white rounded-xl border-2 border-dashed border-primary px-10 py-8 shadow-lg">
        <p className="text-base font-body-bold text-primary">
          Drop files here
        </p>
        <p className="text-xs text-gray-500 mt-1 text-center">
          Images and videos
        </p>
      </div>
    </div>
  );
}
