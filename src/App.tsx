import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@modules/app/context/ThemeProvider";
import { ConfigProvider } from "@modules/app/context/ConfigProvider";
import useTheme from "@modules/app/hooks/useTheme";
import useConfig from "@modules/app/hooks/useConfig";
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
import WorkspaceTagsPage from "@modules/tag/pages/WorkspaceTagsPage";
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
import PricingPage from "@modules/billing/pages/PricingPage";
import SubscriptionPage from "@modules/billing/pages/SubscriptionPage";
import PaymentResultPage from "@modules/billing/pages/PaymentResultPage";
import OnboardingPage from "@modules/onboarding/pages/OnboardingPage";
import PaddlePayPage from "@modules/billing/pages/PaddlePayPage";
import WorkspaceAuditLogPage from "@modules/audit-log/pages/WorkspaceAuditLogPage";
import WorkspaceCannedResponsesPage from "@modules/canned-response/pages/WorkspaceCannedResponsesPage";
import WorkspaceCustomFieldsPage from "@modules/custom-field/pages/WorkspaceCustomFieldsPage";
import WorkspaceReportsPage from "@modules/report/pages/WorkspaceReportsPage";
import UserStatsPage from "@modules/report/pages/UserStatsPage";
import ProtectedRoute from "@modules/app/components/ProtectedRoute";
import AdminRoute from "@modules/app/components/AdminRoute";
import LandingLayout from "@modules/landing/LandingLayout";
import HomePage from "@modules/landing/pages/HomePage";
import PrivacyPage from "@modules/landing/pages/PrivacyPage";
import TermsPage from "@modules/landing/pages/TermsPage";
import RefundPage from "@modules/landing/pages/RefundPage";
import LandingPricingPage from "@modules/landing/pages/PricingPage";
import AdminDiscountsPage from "@modules/admin/pages/AdminDiscountsPage";
import PortalPage from "@modules/portal/pages/PortalPage";
import PortalTicketPage from "@modules/portal/pages/PortalTicketPage";

function ThemedToast() {
  const { theme } = useTheme();
  const toastTheme = theme.startsWith("dark") ? "dark" : "light";
  return <ToastContainer position="top-right" autoClose={3000} theme={toastTheme} />;
}

function AppRoutes() {
  const { saasMode, loading } = useConfig();

  if (loading) return null;

  return (
    <Routes>
      {saasMode && (
        <Route element={<LandingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/pricing" element={<LandingPricingPage />} />
        </Route>
      )}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/portal/:workspaceSlug" element={<PortalPage />} />
      <Route path="/portal/tickets/:portalToken" element={<PortalTicketPage />} />
      <Route path="/invite/:token" element={<InvitationPage />} />
      <Route path="/pay" element={<PaddlePayPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<WorkspacesPage />} />
          <Route path="workspaces/new" element={<WorkspaceCreatePage />} />
          <Route path="workspaces/:workspaceSlug" element={<Navigate to="tickets" replace />} />
          <Route path="workspaces/:workspaceSlug/settings" element={<WorkspaceSettingsPage />} />
          <Route path="workspaces/:workspaceSlug/audit-log" element={<WorkspaceAuditLogPage />} />
          <Route path="workspaces/:workspaceSlug/members" element={<WorkspaceMembersPage />} />
          <Route path="workspaces/:workspaceSlug/invitations" element={<WorkspaceInvitationsPage />} />
          <Route path="workspaces/:workspaceSlug/tags" element={<WorkspaceTagsPage />} />
          <Route path="workspaces/:workspaceSlug/canned-responses" element={<WorkspaceCannedResponsesPage />} />
          <Route path="workspaces/:workspaceSlug/custom-fields" element={<WorkspaceCustomFieldsPage />} />
          <Route path="workspaces/:workspaceSlug/reports" element={<WorkspaceReportsPage />} />
          <Route path="workspaces/:workspaceSlug/stats" element={<UserStatsPage />} />
          <Route path="workspaces/:workspaceSlug/stats/:userId" element={<UserStatsPage />} />
          <Route path="workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
          <Route path="workspaces/:workspaceSlug/tickets/new" element={<TicketCreatePage />} />
          <Route path="workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<Navigate to="account" replace />} />
          <Route path="settings/account" element={<AccountSection />} />
          <Route path="settings/security" element={<PasswordSection />} />
          <Route path="settings/preferences" element={<PreferencesSection />} />
          <Route path="settings/notifications" element={<NotificationsSection />} />
          <Route path="changelog" element={<ChangelogPage />} />
          <Route path="settings/billing" element={<SubscriptionPage />} />
          <Route path="settings/billing/success" element={<PaymentResultPage success />} />
          <Route path="settings/billing/failed" element={<PaymentResultPage success={false} />} />
          <Route path="settings/pricing" element={<PricingPage />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<Navigate to="users" replace />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/workspaces" element={<AdminWorkspacesPage />} />
            <Route path="admin/discounts" element={<AdminDiscountsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={saasMode ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <ConfigProvider>
    <BrowserRouter>
      <UserProvider>
        <ThemedToast />
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
    </ConfigProvider>
    </ThemeProvider>
  );
}
