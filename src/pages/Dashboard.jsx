import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { formatDate } from "../lib/storage.js";

export default function Dashboard() {
  const { books, transactions, users, currentUser } = useLibrary();
  const copies = books.reduce((sum, book) => sum + Number(book.quantity), 0);
  const lowStock = books.filter((book) => book.quantity < 2);
  const recent = [...transactions].reverse().slice(0, 5);

  return (
    <div className="page-wrap">
      <PageHeader eyebrow={`${new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date()).toUpperCase()}, AT THE LIBRARY`} title={`Good ${getTimeOfDay()}, ${currentUser.name.split(" ")[0]}.`} description="Here's what's happening in your little corner of the literary world." />
      <section className="welcome-banner">
        <div><span className="banner-kicker">A GOOD DAY TO GET LOST IN A BOOK</span><h2>Stories are better<br />when they're shared.</h2><p>Browse the shelves and find something wonderful to take home.</p><Link className="banner-link" to="/books">Explore the collection <span>→</span></Link></div>
        <div className="banner-art" aria-hidden="true"><div className="art-sun" /><div className="art-book book-back" /><div className="art-book book-front"><span>READ<br />WIDELY</span><i>✳</i></div><div className="art-stem stem-one" /><div className="art-stem stem-two" /></div>
      </section>
      <section className="stats-grid" aria-label="Library statistics">
        <article className="stat-card"><div className="stat-label">BOOKS ON OUR SHELVES <span>▤</span></div><strong>{books.length}</strong><small>titles in the collection</small></article>
        <article className="stat-card"><div className="stat-label">COPIES TO DISCOVER <span>◉</span></div><strong>{copies}</strong><small>available right now</small></article>
        <article className="stat-card"><div className="stat-label">NEIGHBORHOOD READERS <span>◎</span></div><strong>{users.filter((user) => user.role === "Member").length}</strong><small>active members</small></article>
        <article className={`stat-card ${lowStock.length ? "stat-warn" : ""}`}><div className="stat-label">NEED A LITTLE LOVE <span>✳</span></div><strong>{lowStock.length}</strong><small>titles running low</small></article>
      </section>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">KEEP AN EYE ON</div><h2>Running low</h2></div><Link className="text-link" to="/books">View collection <span>→</span></Link></div>
          {lowStock.length ? <div className="book-list">{lowStock.slice(0, 4).map((book) => <div className="book-row" key={book.id}><div className="book-spine">{book.title.slice(0, 1)}</div><div className="book-info"><strong>{book.title}</strong><small>{book.author}</small></div><span className={`stock-pill ${book.quantity === 0 ? "stock-out" : "stock-low"}`}>{book.quantity === 0 ? "Checked out" : `${book.quantity} left`}</span></div>)}</div> : <EmptyState title="All stocked up" description="Every title has at least two copies available." />}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">FRESH OFF THE SHELF</div><h2>Recent activity</h2></div><Link className="text-link" to="/transactions">See all <span>→</span></Link></div>
          {recent.length ? <div className="activity-list">{recent.map((entry) => <div className="activity-row" key={entry.id}><span className={`activity-icon ${entry.type === "Borrow" ? "activity-borrow" : entry.type === "Return" ? "activity-return" : ""}`}>{entry.type === "Borrow" ? "↗" : entry.type === "Return" ? "↙" : "+"}</span><div><strong>{entry.type}: {entry.bookTitle}</strong><small>{entry.userName} · {formatDate(entry.date)}</small></div></div>)}</div> : <EmptyState title="A quiet moment" description="Book activity will show up here as it happens." />}
        </section>
      </div>
      <p className="data-note">Your library's data is saved on this device.</p>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
