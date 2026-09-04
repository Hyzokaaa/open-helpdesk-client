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
import LoginPage from "@modules/user/pages/LoginPage";
import SignupPage from "@modules/user/pages/SignupPage";
import AuthCallbackPage from "@modules/user/pages/AuthCallbackPage";
import VerifyEmailPage from "@modules/user/pages/VerifyEmailPage";
import ForgotPasswordPage from "@modules/user/pages/ForgotPasswordPage";
import ResetPasswordPage from "@modules/user/pages/ResetPasswordPage";
import DashboardLayout from "@modules/app/components/DashboardLayout";
import WorkspaceSettingsPage from "@modules/workspace/pages/WorkspaceSettingsPage";
import WorkspaceMembersPage from "@modules/workspace/pages/WorkspaceMembersPage";
import WorkspaceContactsPage from "@modules/workspace/pages/WorkspaceContactsPage";
import WorkspaceTagsPage from "@modules/tag/pages/WorkspaceTagsPage";
import WorkspaceDepartmentsPage from "@modules/department/pages/WorkspaceDepartmentsPage";
import WorkspaceOrganizationsPage from "@modules/organization/pages/WorkspaceOrganizationsPage";
import WorkspaceProjectsPage from "@modules/project/pages/WorkspaceProjectsPage";
import WorkspaceCategoriesPage from "@modules/project/pages/WorkspaceCategoriesPage";
import TicketsPage from "@modules/ticket/pages/TicketsPage";
import TicketCreatePage from "@modules/ticket/pages/TicketCreatePage";
import TicketDetailPage from "@modules/ticket/pages/TicketDetailPage";
import WorkspacesPage from "@modules/workspace/pages/WorkspacesPage";
import InvitationPage from "@modules/workspace/pages/InvitationPage";
import WorkspaceInvitationsPage from "@modules/workspace/pages/WorkspaceInvitationsPage";
import WorkspaceCreatePage from "@modules/workspace/pages/WorkspaceCreatePage";
import AdminUsersPage from "@modules/admin/pages/AdminUsersPage";
import AdminWorkspacesPage from "@modules/admin/pages/AdminWorkspacesPage";
import AccountSection from "@modules/user/components/AccountSection";
import PasswordSection from "@modules/user/components/PasswordSection";
import PreferencesSection from "@modules/user/components/PreferencesSection";
import NotificationsSection from "@modules/user/components/NotificationsSection";
import NotificationsPage from "@modules/notification/pages/NotificationsPage";
import ChangelogPage from "@modules/app/pages/ChangelogPage";
import OnboardingPage from "@modules/onboarding/pages/OnboardingPage";
import WorkspaceAuditLogPage from "@modules/audit-log/pages/WorkspaceAuditLogPage";
import SystemLogsPage from "@modules/audit-log/pages/SystemLogsPage";
import WorkspaceCannedResponsesPage from "@modules/canned-response/pages/WorkspaceCannedResponsesPage";
import WorkspaceEmailRulesPage from "@modules/email-rule/pages/WorkspaceEmailRulesPage";
import WorkspaceCustomFieldsPage from "@modules/custom-field/pages/WorkspaceCustomFieldsPage";
import WorkspaceReportsPage from "@modules/report/pages/WorkspaceReportsPage";
import UserStatsPage from "@modules/report/pages/UserStatsPage";
import ProtectedRoute from "@modules/app/components/ProtectedRoute";
import AdminRoute from "@modules/app/components/AdminRoute";
import AdminSettingsPage from "@modules/admin/pages/AdminSettingsPage";
import AdminBrandingPage from "@modules/admin/pages/AdminBrandingPage";
import AdminUpdatesPage from "@modules/admin/pages/AdminUpdatesPage";
import PortalPage from "@modules/portal/pages/PortalPage";
import PortalTicketPage from "@modules/portal/pages/PortalTicketPage";
import PortalKbPage from "@modules/portal/pages/PortalKbPage";
import PortalKbCategoryPage from "@modules/portal/pages/PortalKbCategoryPage";
import PortalKbArticlePage from "@modules/portal/pages/PortalKbArticlePage";
import WorkspaceKbPage from "@modules/knowledge-base/pages/WorkspaceKbPage";
import ProseStyles from "@modules/app/components/ProseStyles";
import WorkspaceGuard from "@modules/app/components/WorkspaceGuard";
import PortalGuard from "@modules/app/components/PortalGuard";
import RootRedirect from "@modules/app/components/RootRedirect";
import PrivacyPage from "@modules/legal/pages/PrivacyPage";
import TermsPage from "@modules/legal/pages/TermsPage";
import CookieConsentBanner from "@modules/legal/components/CookieConsentBanner";

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
    <Routes>
      {extraPublicRoutes}
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
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
            <Route path="admin/settings" element={<AdminSettingsPage />} />
            <Route path="admin/updates" element={<AdminUpdatesPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
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
        <CookieConsentBanner />
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
    </ExtensionProvider>
    </ConfigProvider>
    </ThemeProvider>
  );
}
