import { useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

export default function useColumnDrag(initialKeys: string[]) {
  const [order, setOrder] = useState(initialKeys);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      setOrder((prev) => {
        const from = prev.indexOf(active.id as string);
        const to = prev.indexOf(over.id as string);
        if (from !== -1 && to !== -1) return arrayMove(prev, from, to);
        return prev;
      });
    }
  };

  function reorder<T extends { key: string }>(columns: T[]): T[] {
    const byKey = new Map(columns.map((c) => [c.key, c]));
    const result: T[] = [];
    for (const key of order) {
      const col = byKey.get(key);
      if (col) result.push(col);
    }
    for (const col of columns) {
      if (!order.includes(col.key)) result.push(col);
    }
    return result;
  }

  return { order, handleDragEnd, reorder };
}
