import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@modules/app/context/ThemeProvider";
import { ConfigProvider } from "@modules/app/context/ConfigProvider";
import useTheme from "@modules/app/hooks/useTheme";
import { UserProvider } from "@modules/user/context/UserProvider";
import LoginPage from "@modules/user/pages/LoginPage";
import SignupPage from "@modules/user/pages/SignupPage";
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
import SystemAdminPage from "@modules/admin/pages/SystemAdminPage";
import AccountSection from "@modules/user/components/AccountSection";
import PasswordSection from "@modules/user/components/PasswordSection";
import PreferencesSection from "@modules/user/components/PreferencesSection";
import NotificationsSection from "@modules/user/components/NotificationsSection";
import NotificationsPage from "@modules/notification/pages/NotificationsPage";
import ChangelogPage from "@modules/app/pages/ChangelogPage";
import PricingPage from "@modules/billing/pages/PricingPage";
import SubscriptionPage from "@modules/billing/pages/SubscriptionPage";

function ThemedToast() {
  const { theme } = useTheme();
  const toastTheme = theme.startsWith("dark") ? "dark" : "light";
  return <ToastContainer position="top-right" autoClose={3000} theme={toastTheme} />;
}

export default function App() {
  return (
    <ThemeProvider>
    <ConfigProvider>
    <BrowserRouter>
      <UserProvider>
        <ThemedToast />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="settings/account" replace />} />
            <Route path="workspaces/:workspaceSlug" element={<Navigate to="tickets" replace />} />
            <Route path="workspaces/:workspaceSlug/settings" element={<WorkspaceSettingsPage />} />
            <Route path="workspaces/:workspaceSlug/members" element={<WorkspaceMembersPage />} />
            <Route path="workspaces/:workspaceSlug/tags" element={<WorkspaceTagsPage />} />
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
            <Route path="settings/pricing" element={<PricingPage />} />
            <Route path="admin" element={<SystemAdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
    </ConfigProvider>
    </ThemeProvider>
  );
}
