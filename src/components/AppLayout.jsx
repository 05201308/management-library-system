import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext.jsx";

const navigation = [
  { to: "/", label: "Overview", icon: "◫" },
  { to: "/books", label: "Book collection", icon: "▤" },
  { to: "/transactions", label: "Transactions", icon: "↔" },
  { to: "/users", label: "Members", icon: "◎", adminOnly: true },
];

export default function AppLayout() {
  const { currentUser, setSessionId } = useLibrary();
  const navigate = useNavigate();

  function signOut() {
    setSessionId(null);
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Commonplace home">
          <span className="brand-mark">c.</span>
          <span><strong>commonplace</strong><small>COMMUNITY LIBRARY</small></span>
        </a>
        <div className="side-label">LIBRARY</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.filter((item) => !item.adminOnly || currentUser?.role === "Admin").map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">✳</span>
          <p>Good books make<br />good neighbors.</p>
          <span>— Commonplace Library</span>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">{currentUser?.name?.slice(0, 1).toUpperCase()}</div>
          <div className="profile-copy"><strong>{currentUser?.name}</strong><small>{currentUser?.role}</small></div>
          <button className="icon-button signout" onClick={signOut} aria-label="Sign out" title="Sign out">↗</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="mobile-header">
          <a className="brand" href="/"><span className="brand-mark">c.</span><strong>commonplace</strong></a>
          <button className="button button-quiet" onClick={signOut}>Sign out</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
