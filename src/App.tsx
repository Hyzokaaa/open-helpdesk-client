import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@modules/app/context/ThemeProvider";
import useTheme from "@modules/app/hooks/useTheme";
import { UserProvider } from "@modules/user/context/UserProvider";
import LoginPage from "@modules/user/pages/LoginPage";
import DashboardLayout from "@modules/app/components/DashboardLayout";
import WorkspacesPage from "@modules/workspace/pages/WorkspacesPage";
import WorkspaceMembersPage from "@modules/workspace/pages/WorkspaceMembersPage";
import WorkspaceTagsPage from "@modules/tag/pages/WorkspaceTagsPage";
import TicketsPage from "@modules/ticket/pages/TicketsPage";
import TicketCreatePage from "@modules/ticket/pages/TicketCreatePage";
import TicketDetailPage from "@modules/ticket/pages/TicketDetailPage";
import SystemAdminPage from "@modules/admin/pages/SystemAdminPage";
import SettingsPage from "@modules/user/pages/SettingsPage";
import NotificationsPage from "@modules/notification/pages/NotificationsPage";

function ThemedToast() {
  const { theme } = useTheme();
  const toastTheme = theme.startsWith("dark") ? "dark" : "light";
  return <ToastContainer position="top-right" autoClose={3000} theme={toastTheme} />;
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <UserProvider>
        <ThemedToast />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="workspaces" replace />} />
            <Route path="workspaces" element={<WorkspacesPage />} />
            <Route path="workspaces/:workspaceSlug" element={<Navigate to="tickets" replace />} />
            <Route path="workspaces/:workspaceSlug/members" element={<WorkspaceMembersPage />} />
            <Route path="workspaces/:workspaceSlug/tags" element={<WorkspaceTagsPage />} />
            <Route path="workspaces/:workspaceSlug/tickets" element={<TicketsPage />} />
            <Route path="workspaces/:workspaceSlug/tickets/new" element={<TicketCreatePage />} />
            <Route path="workspaces/:workspaceSlug/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<SystemAdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
