import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BookManagement from './components/BookManagement';
import Transactions from './components/Transactions';
import UserManagement from './components/UserManagement';

export default function App() {
  return (
    <div className="app-shell">
      <nav className="sidebar">
        <h2 className="sidebar-brand">Library</h2>
        <ul className="side-nav">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/books">Books</Link></li>
          <li><Link to="/transactions">Transactions</Link></li>
          <li><Link to="/users">Users</Link></li>
        </ul>
      </nav>
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<BookManagement />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </main>
    </div>
  );
}
