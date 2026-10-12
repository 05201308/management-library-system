import { Navigate, Outlet } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext.jsx";

export default function ProtectedRoute({ adminOnly = false }) {
  const { currentUser } = useLibrary();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && currentUser.role !== "Admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
