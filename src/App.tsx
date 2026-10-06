import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@modules/app/context/ThemeProvider";
import { ConfigProvider } from "@modules/app/context/ConfigProvider";
import ExtensionProvider from "@modules/app/extensions/ExtensionProvider";
import useExtensions from "@modules/app/extensions/useExtensions";
import type { Extensions } from "@modules/app/extensions/extension-context";
import useTheme from "@modules/app/hooks/useTheme";
import useConfig from "@modules/app/hooks/useConfig";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import { UserProvider } from "@modules/user/context/UserProvider";
import DashboardLayout from "@modules/app/components/DashboardLayout";
import ProtectedRoute from "@modules/app/components/ProtectedRoute";
import AdminRoute from "@modules/app/components/AdminRoute";
import ProseStyles from "@modules/app/components/ProseStyles";
import WorkspaceGuard from "@modules/app/components/WorkspaceGuard";
import PortalGuard from "@modules/app/components/PortalGuard";
import RootRedirect from "@modules/app/components/RootRedirect";
import CookieConsentBanner from "@modules/analytics/components/CookieConsentBanner";
import AnalyticsTracker from "@modules/analytics/components/AnalyticsTracker";

// Route-level code splitting: every page is its own chunk, loaded on first visit.
// Layouts, guards and providers stay eager because every route needs them.
const LoginPage = lazy(() => import("@modules/user/pages/LoginPage"));
const SignupPage = lazy(() => import("@modules/user/pages/SignupPage"));
const AuthCallbackPage = lazy(() => import("@modules/user/pages/AuthCallbackPage"));
const VerifyEmailPage = lazy(() => import("@modules/user/pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@modules/user/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@modules/user/pages/ResetPasswordPage"));
const WorkspaceSettingsPage = lazy(() => import("@modules/workspace/pages/WorkspaceSettingsPage"));
const WorkspaceMembersPage = lazy(() => import("@modules/workspace/pages/WorkspaceMembersPage"));
const WorkspaceContactsPage = lazy(() => import("@modules/workspace/pages/WorkspaceContactsPage"));
const WorkspaceTagsPage = lazy(() => import("@modules/tag/pages/WorkspaceTagsPage"));
const WorkspaceDepartmentsPage = lazy(() => import("@modules/department/pages/WorkspaceDepartmentsPage"));
const WorkspaceOrganizationsPage = lazy(() => import("@modules/organization/pages/WorkspaceOrganizationsPage"));
const WorkspaceProjectsPage = lazy(() => import("@modules/project/pages/WorkspaceProjectsPage"));
const WorkspaceCategoriesPage = lazy(() => import("@modules/project/pages/WorkspaceCategoriesPage"));
const TicketsPage = lazy(() => import("@modules/ticket/pages/TicketsPage"));
const TicketCreatePage = lazy(() => import("@modules/ticket/pages/TicketCreatePage"));
const TicketDetailPage = lazy(() => import("@modules/ticket/pages/TicketDetailPage"));
const WorkspacesPage = lazy(() => import("@modules/workspace/pages/WorkspacesPage"));
const InvitationPage = lazy(() => import("@modules/workspace/pages/InvitationPage"));
const WorkspaceInvitationsPage = lazy(() => import("@modules/workspace/pages/WorkspaceInvitationsPage"));
const WorkspaceCreatePage = lazy(() => import("@modules/workspace/pages/WorkspaceCreatePage"));
const AdminUsersPage = lazy(() => import("@modules/admin/pages/AdminUsersPage"));
const AdminWorkspacesPage = lazy(() => import("@modules/admin/pages/AdminWorkspacesPage"));
const AccountSection = lazy(() => import("@modules/user/components/AccountSection"));
const PasswordSection = lazy(() => import("@modules/user/components/PasswordSection"));
const PreferencesSection = lazy(() => import("@modules/user/components/PreferencesSection"));
const NotificationsSection = lazy(() => import("@modules/user/components/NotificationsSection"));
const NotificationsPage = lazy(() => import("@modules/notification/pages/NotificationsPage"));
const ChangelogPage = lazy(() => import("@modules/app/pages/ChangelogPage"));
const OnboardingPage = lazy(() => import("@modules/onboarding/pages/OnboardingPage"));
const WorkspaceAuditLogPage = lazy(() => import("@modules/audit-log/pages/WorkspaceAuditLogPage"));
const SystemLogsPage = lazy(() => import("@modules/audit-log/pages/SystemLogsPage"));
const WorkspaceCannedResponsesPage = lazy(() => import("@modules/canned-response/pages/WorkspaceCannedResponsesPage"));
const WorkspaceEmailRulesPage = lazy(() => import("@modules/email-rule/pages/WorkspaceEmailRulesPage"));
const WorkspaceCustomFieldsPage = lazy(() => import("@modules/custom-field/pages/WorkspaceCustomFieldsPage"));
const WorkspaceReportsPage = lazy(() => import("@modules/report/pages/WorkspaceReportsPage"));
const UserStatsPage = lazy(() => import("@modules/report/pages/UserStatsPage"));
const AdminSettingsPage = lazy(() => import("@modules/admin/pages/AdminSettingsPage"));
const AdminBrandingPage = lazy(() => import("@modules/admin/pages/AdminBrandingPage"));
const AdminAnalyticsPage = lazy(() => import("@modules/admin/pages/AdminAnalyticsPage"));
const AdminUpdatesPage = lazy(() => import("@modules/admin/pages/AdminUpdatesPage"));
const PortalPage = lazy(() => import("@modules/portal/pages/PortalPage"));
const PortalTicketPage = lazy(() => import("@modules/portal/pages/PortalTicketPage"));
const PortalKbPage = lazy(() => import("@modules/portal/pages/PortalKbPage"));
const PortalKbCategoryPage = lazy(() => import("@modules/portal/pages/PortalKbCategoryPage"));
const PortalKbArticlePage = lazy(() => import("@modules/portal/pages/PortalKbArticlePage"));
const WorkspaceKbPage = lazy(() => import("@modules/knowledge-base/pages/WorkspaceKbPage"));
const PrivacyPage = lazy(() => import("@modules/legal/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@modules/legal/pages/TermsPage"));
const ApiDocsPage = lazy(() => import("@modules/api-docs/pages/ApiDocsPage"));

function ThemedToast() {
  const { theme } = useTheme();
  const toastTheme = theme.startsWith("dark") ? "dark" : "light";
  return <ToastContainer position="top-right" autoClose={3000} theme={toastTheme} />;
}

function DomainGate({ children }: { children: React.ReactNode }) {
  const { loading } = useConfig();

  if (loading) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { extraPublicRoutes, extraDashboardRoutes } = useExtensions();

  return (
    <DomainGate>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {extraPublicRoutes}
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/docs" element={<ApiDocsPage />} />
      <Route path="/docs/:section" element={<ApiDocsPage />} />
      <Route path="/docs/reference/:operation" element={<ApiDocsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<PortalGuard />}>
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/portal/kb" element={<PortalKbPage />} />
        <Route path="/portal/kb/:categorySlug" element={<PortalKbCategoryPage />} />
        <Route path="/portal/kb/article/:articleSlug" element={<PortalKbArticlePage />} />
        <Route path="/portal/:workspaceSlug" element={<PortalPage />} />
        <Route path="/portal/:workspaceSlug/kb" element={<PortalKbPage />} />
        <Route path="/portal/:workspaceSlug/kb/:categorySlug" element={<PortalKbCategoryPage />} />
        <Route path="/portal/:workspaceSlug/kb/article/:articleSlug" element={<PortalKbArticlePage />} />
      </Route>
      <Route path="/portal/tickets/:portalToken" element={<PortalTicketPage />} />
      <Route path="/invite/:token" element={<InvitationPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<WorkspacesPage />} />
          <Route path="workspaces/new" element={<WorkspaceCreatePage />} />
          <Route element={<WorkspaceGuard />}>
            <Route path="workspaces/:workspaceSlug" element={<Navigate to="tickets" replace />} />
            <Route path="workspaces/:workspaceSlug/settings" element={<WorkspaceSettingsPage />} />
            <Route path="workspaces/:workspaceSlug/audit-log" element={<WorkspaceAuditLogPage />} />
            <Route path="workspaces/:workspaceSlug/members" element={<WorkspaceMembersPage />} />
            <Route path="workspaces/:workspaceSlug/contacts" element={<WorkspaceContactsPage />} />
            <Route path="workspaces/:workspaceSlug/invitations" element={<WorkspaceInvitationsPage />} />
            <Route path="workspaces/:workspaceSlug/tags" element={<WorkspaceTagsPage />} />
            <Route path="workspaces/:workspaceSlug/departments" element={<WorkspaceDepartmentsPage />} />
            <Route path="workspaces/:workspaceSlug/organizations" element={<WorkspaceOrganizationsPage />} />
            <Route path="workspaces/:workspaceSlug/projects" element={<WorkspaceProjectsPage />} />
            <Route path="workspaces/:workspaceSlug/categories" element={<WorkspaceCategoriesPage />} />
            <Route path="workspaces/:workspaceSlug/canned-responses" element={<WorkspaceCannedResponsesPage />} />
            <Route path="workspaces/:workspaceSlug/email-rules" element={<WorkspaceEmailRulesPage />} />
            <Route path="workspaces/:workspaceSlug/custom-fields" element={<WorkspaceCustomFieldsPage />} />
            <Route path="workspaces/:workspaceSlug/knowledge-base" element={<WorkspaceKbPage />} />
            <Route path="workspaces/:workspaceSlug/reports" element={<WorkspaceReportsPage />} />
            <Route path="workspaces/:workspaceSlug/stats" element={<UserStatsPage />} />
            <Route path="workspaces/:workspaceSlug/stats/:userId" element={<UserStatsPage />} />
            <Route path="workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
            <Route path="workspaces/:workspaceSlug/tickets/new" element={<TicketCreatePage />} />
            <Route path="workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailPage />} />
          </Route>
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<Navigate to="account" replace />} />
          <Route path="settings/account" element={<AccountSection />} />
          <Route path="settings/security" element={<PasswordSection />} />
          <Route path="settings/preferences" element={<PreferencesSection />} />
          <Route path="settings/notifications" element={<NotificationsSection />} />
          <Route path="changelog" element={<ChangelogPage />} />
          {extraDashboardRoutes}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<Navigate to="users" replace />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/workspaces" element={<AdminWorkspacesPage />} />
            <Route path="admin/logs" element={<SystemLogsPage />} />
            <Route path="admin/branding" element={<AdminBrandingPage />} />
            <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="admin/settings" element={<AdminSettingsPage />} />
            <Route path="admin/updates" element={<AdminUpdatesPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
    </DomainGate>
  );
}

interface AppProps {
  extensions?: Partial<Extensions>;
}

export default function App({ extensions }: AppProps) {
  return (
    <ThemeProvider>
    <ConfigProvider>
    <ExtensionProvider extensions={extensions}>
    <BrowserRouter>
      <UserProvider>
        <ProseStyles />
        <ThemedToast />
        <AnalyticsTracker />
        <CookieConsentBanner />
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
    </ExtensionProvider>
    </ConfigProvider>
    </ThemeProvider>
  );
}
