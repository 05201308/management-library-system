import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { createId, formatDate } from "../lib/storage.js";

export default function Transactions() {
  const { books, setBooks, users, transactions, setTransactions, currentUser } = useLibrary();
  const [type, setType] = useState("Borrow");
  const [bookId, setBookId] = useState("");
  const [userId, setUserId] = useState(users.find((user) => user.role === "Member")?.id ?? currentUser.id);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canManageStock = currentUser.role === "Admin";
  const sortedTransactions = useMemo(() => [...transactions].reverse(), [transactions]);
  const transactionUserId = type === "Restock"
    ? currentUser.id
    : users.some((user) => user.id === userId && user.role === "Member")
      ? userId
      : users.find((user) => user.role === "Member")?.id ?? "";

  function chooseType(nextType) {
    setType(nextType);
    if (nextType !== "Restock") setUserId(users.find((user) => user.role === "Member")?.id ?? currentUser.id);
  }

  function submitTransaction(event) {
    event.preventDefault();
    const book = books.find((item) => item.id === bookId);
    const user = users.find((item) => item.id === transactionUserId);
    const amount = Number(quantity);
    if (!book || !user) return setError("Choose a valid book and member.");
    if (!Number.isSafeInteger(amount) || amount < 1) return setError("Quantity must be a whole number greater than zero.");
    if (type === "Borrow" && book.quantity < amount) return setError(`Only ${book.quantity} ${book.quantity === 1 ? "copy is" : "copies are"} available.`);
    if ((type === "Restock" || type === "Return") && !canManageStock) return setError("Only a librarian can add stock or process returns.");

    const updatedQuantity = type === "Borrow" ? book.quantity - amount : book.quantity + amount;
    setBooks((items) => items.map((item) => item.id === book.id ? { ...item, quantity: updatedQuantity } : item));
    setTransactions((items) => [...items, { id: createId(), bookId: book.id, bookTitle: book.title, userId: user.id, userName: user.name, type, quantity: amount, date: new Date().toISOString() }]);
    setError("");
    setNotice(`${type} recorded for ${book.title}.`);
    setQuantity("1");
  }

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="IN AND OUT" title="Transactions" description="Keep track of books finding their way to new readers." />
      <div className="transaction-layout">
        <section className="panel form-panel transaction-form-panel">
          <div className="panel-heading"><div><div className="eyebrow">UPDATE THE SHELVES</div><h2>Record a transaction</h2></div></div>
          <div className="transaction-tabs" role="group" aria-label="Transaction type">
            <button className={type === "Borrow" ? "active" : ""} onClick={() => chooseType("Borrow")} type="button">↗ Borrow</button>
            {canManageStock && <><button className={type === "Return" ? "active" : ""} onClick={() => chooseType("Return")} type="button">↙ Return</button><button className={type === "Restock" ? "active" : ""} onClick={() => chooseType("Restock")} type="button">＋ Restock</button></>}
          </div>
          <form className="form-stack" onSubmit={submitTransaction}>
            <label htmlFor="transaction-book">Book</label><select id="transaction-book" value={bookId} onChange={(event) => setBookId(event.target.value)} required><option value="">Choose a title</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title} ({book.quantity} available)</option>)}</select>
            <label htmlFor="transaction-member">{type === "Restock" ? "Recorded by" : "Member"}</label><select id="transaction-member" value={transactionUserId} onChange={(event) => setUserId(event.target.value)} required disabled={type === "Restock"}>{users.filter((user) => type === "Restock" || user.role === "Member").map((user) => <option key={user.id} value={user.id}>{user.name} · {user.membershipId}</option>)}</select>
            <label htmlFor="transaction-quantity">Number of copies</label><input id="transaction-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
            <button className="button button-primary button-wide" type="submit">Record {type.toLowerCase()} <span>→</span></button>
          </form>
          <p className="form-footnote">{type === "Borrow" ? "Borrowing will reduce the available stock." : type === "Return" ? "Returning will add copies back to the available stock." : "Restocking will add new copies to the collection."}</p>
        </section>
        <section className="panel history-panel">
          <div className="panel-heading"><div><div className="eyebrow">THE PAPER TRAIL</div><h2>Transaction history</h2></div><span className="count-chip">{transactions.length} total</span></div>
          {sortedTransactions.length ? <div className="table-scroll"><table><thead><tr><th>ACTIVITY</th><th>MEMBER</th><th>DATE</th><th>QTY</th></tr></thead><tbody>{sortedTransactions.map((entry) => <tr key={entry.id}><td><div className="transaction-title"><span className={`activity-icon ${entry.type === "Borrow" ? "activity-borrow" : entry.type === "Return" ? "activity-return" : ""}`}>{entry.type === "Borrow" ? "↗" : entry.type === "Return" ? "↙" : "+"}</span><span><strong>{entry.bookTitle}</strong><small>{entry.type}</small></span></div></td><td>{entry.userName}</td><td className="date-cell">{formatDate(entry.date)}</td><td>{entry.quantity}</td></tr>)}</tbody></table></div> : <EmptyState title="Nothing on the record yet" description="Your first borrow, return, or restock will appear here." />}
        </section>
      </div>
    </div>
  );
}
