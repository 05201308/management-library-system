import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { createId } from "../lib/storage.js";

const blankBook = { title: "", author: "", genre: "", isbn: "", quantity: "1" };

export default function Books() {
  const { books, setBooks, currentUser } = useLibrary();
  const [form, setForm] = useState(blankBook);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isAdmin = currentUser.role === "Admin";
  const filteredBooks = useMemo(() => books.filter((book) => `${book.title} ${book.author} ${book.genre} ${book.isbn}`.toLowerCase().includes(search.toLowerCase())), [books, search]);

  function submitBook(event) {
    event.preventDefault();
    const quantity = Number(form.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      setError("Quantity must be a whole number of zero or more.");
      setNotice("");
      return;
    }
    const normalizedIsbn = form.isbn.replace(/[\s-]/g, "").toUpperCase();
    if (books.some((book) => book.id !== editingId && book.isbn.replace(/[\s-]/g, "").toUpperCase() === normalizedIsbn)) {
      setError("That ISBN is already in the collection.");
      setNotice("");
      return;
    }
    if (editingId) {
      setBooks((items) => items.map((book) => book.id === editingId ? { ...book, ...form, quantity } : book));
      setNotice("Book details updated.");
    } else {
      setBooks((items) => [{ ...form, id: createId(), quantity }, ...items]);
      setNotice("Book added to the collection.");
    }
    setForm(blankBook);
    setEditingId(null);
    setError("");
  }

  function startEdit(book) {
    setForm({ title: book.title, author: book.author, genre: book.genre, isbn: book.isbn, quantity: String(book.quantity) });
    setEditingId(book.id);
    setNotice("");
    setError("");
  }

  function deleteBook(book) {
    if (!window.confirm(`Remove "${book.title}" from the collection?`)) return;
    setBooks((items) => items.filter((item) => item.id !== book.id));
    if (editingId === book.id) {
      setForm(blankBook);
      setEditingId(null);
    }
    setNotice(`"${book.title}" was removed.`);
  }

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="THE SHELVES" title="Book collection" description="Every story we have to share, all in one place." action={<span className="count-chip">{books.length} {books.length === 1 ? "title" : "titles"}</span>} />
      <div className={`collection-layout ${isAdmin ? "" : "collection-layout-wide"}`}>
        {isAdmin && <section className="panel form-panel">
          <div className="panel-heading"><div><div className="eyebrow">{editingId ? "MAKE IT JUST RIGHT" : "GROW THE COLLECTION"}</div><h2>{editingId ? "Update a book" : "Add a book"}</h2></div></div>
          <form className="form-stack" onSubmit={submitBook}>
            <label htmlFor="book-title">Title</label><input id="book-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required maxLength="120" placeholder="The name of the book" />
            <label htmlFor="book-author">Author</label><input id="book-author" value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} required maxLength="100" placeholder="Who wrote it?" />
            <label htmlFor="book-genre">Genre</label><input id="book-genre" value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} required maxLength="50" placeholder="Fiction, history, poetry…" />
            <label htmlFor="book-isbn">ISBN</label><input id="book-isbn" value={form.isbn} onChange={(event) => setForm({ ...form, isbn: event.target.value })} required pattern="[0-9Xx -]{10,20}" title="Enter a valid ISBN using 10–20 digits, X, spaces, or hyphens." placeholder="978-0-00-000000-0" />
            <label htmlFor="book-quantity">{editingId ? "Copies in stock (managed in Transactions)" : "Initial quantity"}</label><input id="book-quantity" type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required disabled={Boolean(editingId)} />
            {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
            <div className="form-buttons"><button className="button button-primary button-wide" type="submit">{editingId ? "Save changes" : "Add to collection"} <span>→</span></button>{editingId && <button className="button button-quiet button-wide" type="button" onClick={() => { setEditingId(null); setForm(blankBook); setNotice(""); }}>Cancel</button>}</div>
          </form>
          <p className="form-footnote">Low-stock titles have fewer than 2 copies.</p>
        </section>}
        <section className="panel collection-panel">
          <div className="collection-toolbar"><div><div className="eyebrow">THE CATALOG</div><h2>Find a story</h2></div><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search books" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, authors…" /></label></div>
          {filteredBooks.length ? <div className="table-scroll"><table><thead><tr><th>BOOK</th><th>GENRE</th><th>ISBN</th><th>AVAILABLE</th>{isAdmin && <th>MANAGE</th>}</tr></thead><tbody>{filteredBooks.map((book) => <tr key={book.id}><td><div className="table-book"><span className="book-spine">{book.title.slice(0, 1)}</span><span><strong>{book.title}</strong><small>{book.author}</small></span></div></td><td><span className="genre-tag">{book.genre}</span></td><td className="isbn-cell">{book.isbn}</td><td><span className={`stock-pill ${book.quantity < 2 ? book.quantity === 0 ? "stock-out" : "stock-low" : "stock-ok"}`}>{book.quantity === 0 ? "Out" : `${book.quantity} ${book.quantity === 1 ? "copy" : "copies"}`}</span></td>{isAdmin && <td><div className="table-actions"><button className="text-button" onClick={() => startEdit(book)}>Update</button><button className="text-button danger-text" onClick={() => deleteBook(book)}>Delete</button></div></td>}</tr>)}</tbody></table></div> : <EmptyState title="No books found" description={search ? "Try another title, author, genre, or ISBN." : "Add the first book to start your collection."} />}
          {!isAdmin && <p className="member-note">Ask a librarian if you spot a book detail that needs updating.</p>}
        </section>
      </div>
    </div>
  );
}
