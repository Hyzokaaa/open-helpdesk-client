import { Suspense, type ReactNode } from "react";
import { useLocation, useParams } from "react-router";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";

/**
 * Shows a loader in place of a page whose code is still downloading.
 *
 * React Router navigates inside a transition, and React keeps an already visible Suspense
 * boundary on the previous screen instead of showing its fallback again: the URL changes
 * but the page looks frozen until the new page's code arrives. A boundary that is new to
 * the navigation does show its fallback, so this one gets a new key per route.
 *
 * The key is the route pattern (`/tickets/:ticketId`), not the URL, so moving between two
 * tickets keeps the page mounted as before.
 */
export default function RouteSuspense({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const params = useParams();

  const values = new Map(
    Object.entries(params)
      .filter(([name, value]) => name !== "*" && value)
      .map(([name, value]) => [value as string, name]),
  );
  const routeKey = pathname
    .split("/")
    .map((segment) => (values.has(segment) ? `:${values.get(segment)}` : segment))
    .join("/");

  return (
    <Suspense key={routeKey} fallback={<PageLoader fullScreen={false} />}>
      {children}
    </Suspense>
  );
}
