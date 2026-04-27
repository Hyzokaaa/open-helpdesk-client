import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

interface Props {
  id: string;
  children: React.ReactNode;
  className?: string;
  width?: string;
  sortable?: boolean;
  onClick?: () => void;
}

export default function SortableTh({ id, children, className, width, sortable, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    width,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={clsx(
        "px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase select-none",
        sortable && "cursor-pointer hover:text-secondary-text",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="text-subtle hover:text-muted cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </span>
        {children}
      </div>
    </th>
  );
}
