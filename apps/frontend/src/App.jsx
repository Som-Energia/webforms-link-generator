import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  return window.location.pathname === "/admin" ? <AdminPage /> : <LoginPage />;
}
