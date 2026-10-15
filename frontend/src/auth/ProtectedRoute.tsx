import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ admin = false }: { admin?: boolean }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  if (admin && session.role !== "ADMIN") return <Navigate to="/app" replace />;
  return <Outlet />;
}
