import type { ReactNode } from "react";
import { Link } from "react-router";

export default function DocLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-primary hover:underline font-body-medium">
      {children}
    </Link>
  );
}
