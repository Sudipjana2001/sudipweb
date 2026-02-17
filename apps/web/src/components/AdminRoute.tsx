import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * A route guard component that restricts access to admin-only pages.
 * - While auth is loading, shows a spinner.
 * - If the user is not logged in or not an admin, redirects to home.
 * - Otherwise, renders the child content.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * A route guard that prevents admin users from accessing regular user pages.
 * - While auth is loading, renders the children normally (avoids flicker).
 * - If the user is an admin, redirects them to /admin.
 * - Otherwise (regular user or not logged in), renders the child content.
 */
export function UserRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <>{children}</>;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
