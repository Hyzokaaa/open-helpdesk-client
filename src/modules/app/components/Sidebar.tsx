import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import clsx from "clsx";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import { Workspace, listWorkspaces } from "@modules/workspace/services/workspace.service";
import { PaletteContext } from "@modules/workspace/context/PaletteProvider";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import useConfig from "@modules/app/hooks/useConfig";
import { P } from "@modules/workspace/domain/permissions";
import { canCreateWorkspace } from "@modules/workspace/domain/can-create-workspace";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { useLeaveGuard } from "@modules/app/hooks/useUnsavedChanges";
import NavIcon, { NavIconName } from "./nav-icons";
import SidebarTooltip from "./SidebarTooltip";
import SidebarFlyout from "./SidebarFlyout";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  /** Folded to a rail of icons; only ever on a wide screen. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  /** A core icon by name, or an extension's own drawing; without one, the generic icon. */
  icon?: NavIconName | ReactNode;
}

type Flyout = "workspace" | "user" | "admin";

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const iconOf = (icon: NavItem["icon"]) =>
  typeof icon === "string" || icon == null ? <NavIcon name={icon as NavIconName | undefined} /> : icon;

export default function Sidebar({ mobileOpen, onClose, collapsed = false, onToggleCollapsed }: SidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { t } = useTranslation();
  const { extraSettingsNav, extraAdminNav } = useExtensions();
  const { clearWorkspacePalette } = useContext(PaletteContext);
  const confirmLeave = useLeaveGuard();
  const { domainWorkspaces, loading: configLoading, brandName, brandSubtitle, brandLogo, brandIcon } = useConfig();
  const isCustomDomain = !!domainWorkspaces;
  const lockedWorkspace = domainWorkspaces?.length === 1 ? domainWorkspaces[0] : null;

  const asideRef = useRef<HTMLElement>(null);
  const wsSwitcherRef = useRef<HTMLDivElement>(null);
  const wsButtonRef = useRef<HTMLButtonElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const adminButtonRef = useRef<HTMLButtonElement>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsSwitcherOpen, setWsSwitcherOpen] = useState(false);
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  const [flyout, setFlyout] = useState<{ kind: Flyout; viaKeyboard: boolean } | null>(null);

  // The rail is a wide-screen thing: the phone drawer always shows in full
  const rail = collapsed && !mobileOpen;

  const isSettingsActive = location.pathname.startsWith("/dashboard/settings") || location.pathname === "/dashboard/deleted-workspaces";
  const isAdminActive = location.pathname.startsWith("/dashboard/admin");
  const isWorkspacesActive = location.pathname.startsWith("/dashboard/workspaces");

  const [wsOpen, setWsOpen] = useState(!!workspaceSlug);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);
  const [adminOpen, setAdminOpen] = useState(isAdminActive);

  const currentSlug = lockedWorkspace?.slug ?? workspaceSlug ?? lastSlug;
  const activeWs = lockedWorkspace
    ? { id: "", name: lockedWorkspace.name, slug: lockedWorkspace.slug, description: "", role: "admin", palette: lockedWorkspace.palette }
    : workspaces.find((ws) => ws.slug === currentSlug);
  const { can } = usePermissions(currentSlug ?? undefined);
  const isLocked = !!lockedWorkspace;
  const configReady = !configLoading;
  const domainSlugs = domainWorkspaces?.map((w) => w.slug) ?? null;
  const showCreateWorkspace = canCreateWorkspace(user, isCustomDomain);
  const filteredWorkspaces = domainSlugs ? workspaces.filter((ws) => domainSlugs.includes(ws.slug)) : workspaces;
  const isSingleWorkspace = filteredWorkspaces.length <= 1 && !showCreateWorkspace;
  const showAdmin = !!user?.isSystemAdmin && configReady && !isCustomDomain;

  useEffect(() => {
    if (user) listWorkspaces().then(setWorkspaces);
  }, [user?.id, location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsSwitcherRef.current && !wsSwitcherRef.current.contains(e.target as Node)) {
        setWsSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (workspaceSlug) {
      setLastSlug(workspaceSlug);
      setWsOpen(true);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    if (isSettingsActive) setSettingsOpen(true);
    if (isAdminActive) setAdminOpen(true);
  }, [isSettingsActive, isAdminActive]);

  useEffect(() => {
    if (mobileOpen) onClose?.();
    setFlyout(null);
  }, [location.pathname]);

  // Folding or unfolding closes whatever was open beside the old shape
  useEffect(() => {
    setFlyout(null);
    setWsSwitcherOpen(false);
  }, [rail]);

  const isActive = (path: string) => location.pathname === path;
  // Workspace settings has a page per section under its own path
  const isNavActive = (path: string) => isActive(path) || (path.endsWith("/settings") && location.pathname.startsWith(path + "/"));

  // A form with unsaved changes asks before a menu link takes you away from it
  const guardLink = (e: React.MouseEvent, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    confirmLeave(() => navigate(path));
  };

  const ws = (path: string) => `/dashboard/workspaces/${currentSlug}/${path}`;
  const workspaceNav: NavItem[] = currentSlug
    ? [
        { label: t("sidebar.tickets"), path: ws("tickets"), icon: "tickets" },
        { label: t("sidebar.myStats"), path: ws("stats"), icon: "myStats" },
        ...(can(P.WORKSPACE_MEMBERS_VIEW) ? [{ label: t("sidebar.members"), path: ws("members"), icon: "members" as const }] : []),
        ...(can(P.WORKSPACE_MEMBERS_VIEW) ? [{ label: t("sidebar.contacts"), path: ws("contacts"), icon: "contacts" as const }] : []),
        ...(can(P.WORKSPACE_INVITATIONS_MANAGE) ? [{ label: t("sidebar.invitations"), path: ws("invitations"), icon: "invitations" as const }] : []),
        ...(can(P.TAG_VIEW) ? [{ label: t("sidebar.tags"), path: ws("tags"), icon: "tags" as const }] : []),
        ...(can(P.CATEGORY_VIEW) ? [{ label: t("sidebar.categories"), path: ws("categories"), icon: "categories" as const }] : []),
        ...(can(P.DEPARTMENT_VIEW) ? [{ label: t("sidebar.departments"), path: ws("departments"), icon: "departments" as const }] : []),
        ...(can(P.ORGANIZATION_VIEW) ? [{ label: t("sidebar.organizations"), path: ws("organizations"), icon: "organizations" as const }] : []),
        ...(can(P.PROJECT_VIEW) ? [{ label: t("sidebar.projects"), path: ws("projects"), icon: "projects" as const }] : []),
        ...(can(P.CANNED_RESPONSE_VIEW) ? [{ label: t("sidebar.cannedResponses"), path: ws("canned-responses"), icon: "cannedResponses" as const }] : []),
        ...(can(P.WORKSPACE_SETTINGS_MANAGE) ? [{ label: t("sidebar.emailRules"), path: ws("email-rules"), icon: "emailRules" as const }] : []),
        ...(can(P.CUSTOM_FIELD_MANAGE) ? [{ label: t("sidebar.customFields"), path: ws("custom-fields"), icon: "customFields" as const }] : []),
        ...(can(P.KB_ARTICLE_VIEW) ? [{ label: t("sidebar.knowledgeBase"), path: ws("knowledge-base"), icon: "knowledgeBase" as const }] : []),
        ...(can(P.WORKSPACE_SETTINGS_MANAGE) ? [{ label: t("sidebar.settings"), path: ws("settings"), icon: "settings" as const }] : []),
        ...(can(P.REPORT_VIEW) ? [{ label: t("sidebar.reports"), path: ws("reports"), icon: "reports" as const }] : []),
        ...(can(P.AUDIT_LOG_VIEW) ? [{ label: t("sidebar.auditLog"), path: ws("audit-log"), icon: "auditLog" as const }] : []),
      ]
    : [];

  const settingsNav: NavItem[] = [
    { label: t("settings.account"), path: "/dashboard/settings/account", icon: "account" },
    { label: t("settings.security"), path: "/dashboard/settings/security", icon: "security" },
    { label: t("settings.preferences"), path: "/dashboard/settings/preferences", icon: "preferences" },
    { label: t("notifications.preferences"), path: "/dashboard/settings/notifications", icon: "notifications" },
    { label: t("workspaceDelete.listTitle"), path: "/dashboard/deleted-workspaces", icon: "deletedWorkspaces" },
    ...extraSettingsNav.map((item) => ({ ...item, label: t(item.label as any) })),
  ];

  const adminNav: NavItem[] = [
    { label: t("sidebar.adminUsers"), path: "/dashboard/admin/users", icon: "adminUsers" },
    { label: t("sidebar.adminWorkspaces"), path: "/dashboard/admin/workspaces", icon: "adminWorkspaces" },
    { label: t("sidebar.adminBranding"), path: "/dashboard/admin/branding", icon: "adminBranding" },
    { label: t("sidebar.adminAnalytics"), path: "/dashboard/admin/analytics", icon: "adminAnalytics" },
    { label: t("sidebar.adminSettings"), path: "/dashboard/admin/settings", icon: "adminSettings" },
    { label: t("sidebar.adminUpdates"), path: "/dashboard/admin/updates", icon: "adminUpdates" },
    { label: t("sidebar.adminLogs"), path: "/dashboard/admin/logs", icon: "adminLogs" },
    ...extraAdminNav.map((item) => ({ ...item, label: t(item.label as any) })),
  ];

  // The text stays in the page while folded, only clipped: the icon's accessible name is its label
  const label = (text: ReactNode, className?: string) => (
    <span className={clsx("min-w-0 truncate transition-opacity duration-100 motion-reduce:transition-none", rail && "lg:opacity-0", className)}>
      {text}
    </span>
  );

  const rowClass = (active: boolean) =>
    clsx(
      "group relative flex items-center gap-2.5 h-8 max-lg:h-10 pl-[11px] pr-2.5 rounded-lg text-[13px] whitespace-nowrap overflow-hidden transition-colors cursor-pointer",
      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
      rail ? "lg:w-10" : "w-full",
      active
        ? "bg-surface-active text-primary font-body-semibold"
        : "text-secondary-text font-body-medium hover:bg-surface-hover hover:text-heading",
    );

  const iconClass = (active: boolean) => clsx("flex shrink-0", active ? "text-primary" : "text-muted group-hover:text-secondary-text");

  const link = (item: NavItem) => {
    const active = isNavActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={(e) => guardLink(e, item.path)}
        aria-current={active ? "page" : undefined}
        data-tip={rail ? item.label : undefined}
        className={rowClass(active)}
      >
        <span className={iconClass(active)}>{iconOf(item.icon)}</span>
        {label(item.label)}
      </Link>
    );
  };

  const blockHeader = (title: string, open: boolean, active: boolean, onToggle: () => void, controls: string) => (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className={clsx(
        "w-full flex items-center justify-between h-7 px-[11px] rounded-md text-exs uppercase tracking-[.06em] font-body-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
        active ? "text-primary" : "text-muted hover:text-heading",
      )}
    >
      {title}
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        className={clsx("size-3.5 transition-transform duration-150 motion-reduce:transition-none", !open && "-rotate-90")}>
        <path d="m4 6 4 4 4-4" />
      </svg>
    </button>
  );

  // The folded rail shows the secondary blocks as one button each, opening a panel with their links
  const blockButton = (kind: "user" | "admin", title: string, icon: NavIconName, active: boolean, ref: React.RefObject<HTMLButtonElement | null>) => {
    const open = flyout?.kind === kind;
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? `sidebar-flyout-${kind}` : undefined}
        data-tip={title}
        onClick={(e) => setFlyout(open ? null : { kind, viaKeyboard: e.detail === 0 })}
        className={rowClass(active)}
      >
        <span className={iconClass(active)}><NavIcon name={icon} /></span>
        {label(title)}
        {active && <span className="sr-only">, {t("sidebar.currentSection")}</span>}
      </button>
    );
  };

  // In the rail only a square mark fits: the icon, or the initial; a wide logo would shrink to nothing
  const brandMark = rail ? brandIcon : brandIcon || brandLogo;

  // In a panel the links always show their names
  const flyoutLink = (item: NavItem) => {
    const active = isNavActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={(e) => guardLink(e, item.path)}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "group flex items-center gap-2.5 h-8 px-2 rounded-lg text-[13px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          active ? "bg-surface-active text-primary font-body-semibold" : "text-secondary-text font-body-medium hover:bg-surface-hover hover:text-heading",
        )}
      >
        <span className={iconClass(active)}>{iconOf(item.icon)}</span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const workspaceOptions = () => (
    <>
      {filteredWorkspaces.map((w) => (
        <button
          key={w.id}
          type="button"
          aria-current={w.slug === currentSlug ? "true" : undefined}
          onClick={() => {
            setWsSwitcherOpen(false);
            setFlyout(null);
            confirmLeave(() => navigate(`/dashboard/workspaces/${w.slug}/tickets`));
          }}
          className={clsx(
            "w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
            w.slug === currentSlug ? "bg-surface-active" : "hover:bg-surface-hover",
          )}
        >
          <div className={clsx(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-exs font-body-bold",
            w.slug === currentSlug ? "bg-primary/15 text-primary" : "bg-surface-hover text-muted",
          )}>
            {initials(w.name)}
          </div>
          <p className={clsx("flex-1 min-w-0 text-xs font-body-semibold truncate", w.slug === currentSlug ? "text-primary" : "text-heading")}>
            {w.name}
          </p>
        </button>
      ))}
      {showCreateWorkspace && (
        <div className="border-t border-border-card mt-1 pt-1">
          <Link
            to="/dashboard/workspaces/new"
            onClick={(e) => { setWsSwitcherOpen(false); setFlyout(null); guardLink(e, "/dashboard/workspaces/new"); }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-body-medium text-muted hover:text-primary hover:bg-surface-hover transition-colors rounded-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <span className="w-7 h-7 rounded-md bg-surface-hover flex items-center justify-center text-sm">+</span>
            {t("workspaces.newWorkspace")}
          </Link>
        </div>
      )}
    </>
  );

  const sidebarContent = (
    <aside
      id="app-sidebar"
      ref={asideRef}
      className={clsx(
        "fixed left-0 top-0 h-dvh bg-surface border-r border-border-card flex-col z-50 overflow-x-hidden",
        "transition-[width] duration-200 ease-[cubic-bezier(.2,0,0,1)] motion-reduce:transition-none",
        rail ? "w-[240px] lg:w-16" : "w-[240px]",
        mobileOpen ? "flex" : "hidden lg:flex",
      )}
    >
      {/* App brand */}
      <Link
        to="/dashboard"
        onClick={(e) => { setLastSlug(null); clearWorkspacePalette(); guardLink(e, "/dashboard"); }}
        data-tip={rail ? brandName : undefined}
        className="flex items-center gap-2.5 h-16 shrink-0 px-4 border-b border-border-card hover:bg-surface-hover transition-colors overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {brandMark ? (
          <img src={brandMark} alt="" className="w-8 h-8 object-contain shrink-0 rounded" />
        ) : rail ? (
          <span aria-hidden="true" className="w-8 h-8 shrink-0 rounded-lg bg-primary-700 text-on-primary font-body-bold text-[15px] grid place-items-center">
            {brandName.trim().charAt(0).toUpperCase()}
          </span>
        ) : null}
        <div className={clsx("min-w-0 transition-opacity duration-100 motion-reduce:transition-none", rail && "lg:opacity-0")}>
          <p className="text-base font-body-bold text-primary truncate">{brandName}</p>
          {brandSubtitle && <p className="text-exs text-muted font-body-medium truncate">{brandSubtitle}</p>}
        </div>
      </Link>

      {/* Workspace switcher */}
      {!configReady ? (
        <div className="w-full flex items-center justify-center px-4 py-5 border-b border-border-card">
          <Spinner width={16} />
        </div>
      ) : isLocked ? (
        // A custom domain pinned to one workspace: the brand above already says where you are
        null
      ) : isSingleWorkspace ? (
        // Nothing to switch to: a single discreet line naming the workspace
        <div data-tip={rail ? activeWs?.name : undefined} className="w-full flex items-center gap-2 px-4 py-2 border-b border-border-card overflow-hidden">
          {activeWs && (
            <div className="w-6 h-6 ml-1 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-exs font-body-bold text-primary">{initials(activeWs.name)}</span>
            </div>
          )}
          {label(activeWs?.name, "flex-1 text-xs font-body-semibold text-heading")}
        </div>
      ) : (
        <div ref={wsSwitcherRef} className="relative">
          <button
            ref={wsButtonRef}
            type="button"
            aria-haspopup="true"
            aria-expanded={rail ? flyout?.kind === "workspace" : wsSwitcherOpen}
            data-tip={rail && activeWs ? `${activeWs.name} · ${t("sidebar.switchWorkspace")}` : undefined}
            onClick={(e) => {
              if (workspaces.length === 0) {
                if (showCreateWorkspace) confirmLeave(() => navigate("/dashboard/workspaces/new"));
                return;
              }
              if (rail) setFlyout(flyout?.kind === "workspace" ? null : { kind: "workspace", viaKeyboard: e.detail === 0 });
              else setWsSwitcherOpen(!wsSwitcherOpen);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-card hover:bg-surface-hover transition-colors cursor-pointer text-left overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-body-bold text-primary">{activeWs ? initials(activeWs.name) : "+"}</span>
            </div>
            <div className={clsx("flex-1 min-w-0 transition-opacity duration-100 motion-reduce:transition-none", rail && "lg:opacity-0")}>
              {activeWs ? (
                <>
                  <p className="text-sm font-body-bold text-heading truncate">{activeWs.name}</p>
                  {/* The slug is an address, not a name; what this line needs to say is that it switches */}
                  <p className="text-exs text-muted font-body-medium truncate">{t("sidebar.switchWorkspace")}</p>
                </>
              ) : (
                <p className="text-sm font-body-medium text-muted">
                  {workspaces.length > 0 ? t("sidebar.selectWorkspace") : t("sidebar.createWorkspace")}
                </p>
              )}
            </div>
            {workspaces.length > 0 && !rail && (
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted shrink-0">
                <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />
              </svg>
            )}
          </button>

          {wsSwitcherOpen && !rail && (
            <div className="absolute left-3 right-3 z-50 mt-1 bg-surface border border-border-input rounded-lg shadow-lg p-1 max-h-64 overflow-auto">
              {workspaceOptions()}
            </div>
          )}
        </div>
      )}

      <nav aria-label={t("sidebar.mainNav")} className="flex-1 min-h-0 flex flex-col">
        {/* One scroll for the whole menu; user settings and administration are pushed to its bottom */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden px-3 pt-2 pb-2 [scrollbar-width:thin]">
          {/* Workspace nav: folded, its links stay as icons whether the block was open or not */}
          {currentSlug && (
            <>
              <div className={clsx(rail && "lg:hidden")}>
                {blockHeader(t("sidebar.workspace"), wsOpen, isWorkspacesActive, () => setWsOpen(!wsOpen), "sidebar-block-workspace")}
              </div>
              {(wsOpen || rail) && (
                <div id="sidebar-block-workspace" className="flex flex-col gap-0.5 mt-0.5">
                  {workspaceNav.map(link)}
                </div>
              )}
            </>
          )}

          {/* At the bottom in both shapes: blocks while unfolded, one button each opening a panel while
              folded. When everything fits they rest at the bottom; when not, they scroll with the rest */}
          {!rail && (
          <div className="mt-auto pt-3">
            <div className="border-t border-border-card -mx-3 mb-2" />
            <div>
              {blockHeader(t("nav.userSettings"), settingsOpen, isSettingsActive, () => setSettingsOpen(!settingsOpen), "sidebar-block-user")}
              {settingsOpen && (
                <div id="sidebar-block-user" className="flex flex-col gap-0.5 mt-0.5 mb-1">{settingsNav.map(link)}</div>
              )}
            </div>
            {showAdmin && (
              <div className="mt-1">
                {blockHeader(t("sidebar.administration"), adminOpen, isAdminActive, () => setAdminOpen(!adminOpen), "sidebar-block-admin")}
                {adminOpen && (
                  <div id="sidebar-block-admin" className="flex flex-col gap-0.5 mt-0.5 mb-1">{adminNav.map(link)}</div>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border-card px-3 py-2 flex flex-col gap-0.5 max-lg:hidden">
          {rail && (
            <>
              {blockButton("user", t("nav.userSettings"), "blockUser", isSettingsActive, userButtonRef)}
              {showAdmin && blockButton("admin", t("sidebar.administration"), "blockAdmin", isAdminActive, adminButtonRef)}
            </>
          )}
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-controls="app-sidebar"
              aria-keyshortcuts="["
              data-tip={rail ? t("sidebar.expand") : undefined}
              data-tip-shortcut={rail ? "[" : undefined}
              className={rowClass(false)}
            >
              <span className={iconClass(false)}><NavIcon name={rail ? "sidebarExpand" : "sidebarCollapse"} /></span>
              {label(rail ? t("sidebar.expand") : t("sidebar.collapse"), "flex-1 text-left")}
              {!rail && (
                <kbd aria-hidden="true" className="ml-auto text-exs font-mono text-muted border border-border-input border-b-2 rounded px-1.5 leading-4">[</kbd>
              )}
            </button>
          )}
        </div>
      </nav>

      <SidebarTooltip containerRef={asideRef} enabled={rail && !flyout} />

      {rail && flyout?.kind === "workspace" && (
        <SidebarFlyout id="sidebar-flyout-workspace" title={t("sidebar.switchWorkspace")} triggerRef={wsButtonRef} containerRef={asideRef} focusFirst={flyout.viaKeyboard} onClose={() => setFlyout(null)}>
          {workspaceOptions()}
        </SidebarFlyout>
      )}
      {rail && flyout?.kind === "user" && (
        <SidebarFlyout id="sidebar-flyout-user" title={t("nav.userSettings")} triggerRef={userButtonRef} containerRef={asideRef} focusFirst={flyout.viaKeyboard} onClose={() => setFlyout(null)}>
          {settingsNav.map(flyoutLink)}
        </SidebarFlyout>
      )}
      {rail && flyout?.kind === "admin" && (
        <SidebarFlyout id="sidebar-flyout-admin" title={t("sidebar.administration")} triggerRef={adminButtonRef} containerRef={asideRef} focusFirst={flyout.viaKeyboard} onClose={() => setFlyout(null)}>
          {adminNav.map(flyoutLink)}
        </SidebarFlyout>
      )}
    </aside>
  );

  if (mobileOpen) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
        {sidebarContent}
      </>
    );
  }

  return sidebarContent;
}
