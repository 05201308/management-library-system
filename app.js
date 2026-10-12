"use strict";

const STORAGE_KEYS = {
  books: "neighbourhood-library-books",
  users: "neighbourhood-library-users",
  transactions: "neighbourhood-library-transactions",
  currentUser: "neighbourhood-library-current-user"
};

const starterBooks = [
  { id: "book-1", title: "Things Fall Apart", author: "Chinua Achebe", genre: "Fiction", isbn: "9780385474542", quantity: 4 },
  { id: "book-2", title: "The Alchemist", author: "Paulo Coelho", genre: "Fiction", isbn: "9780062315007", quantity: 1 },
  { id: "book-3", title: "Born a Crime", author: "Trevor Noah", genre: "Biography", isbn: "9780399588198", quantity: 3 },
  { id: "book-4", title: "A Brief History of Time", author: "Stephen Hawking", genre: "Science", isbn: "9780553380163", quantity: 0 },
  { id: "book-5", title: "The Secret Garden", author: "Frances Hodgson Burnett", genre: "Children", isbn: "9780141321069", quantity: 2 }
];

const starterUsers = [
  { id: "user-admin", name: "Library Admin", membershipId: "ADMIN001", role: "Librarian" },
  { id: "user-member", name: "Mpho Takalimane", membershipId: "MEM001", role: "Member" }
];

const state = {
  books: loadCollection(STORAGE_KEYS.books, starterBooks),
  users: loadCollection(STORAGE_KEYS.users, starterUsers),
  transactions: loadCollection(STORAGE_KEYS.transactions, []),
  currentUserId: localStorage.getItem(STORAGE_KEYS.currentUser),
  activeView: "dashboard",
  toastTimer: null
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

function loadCollection(key, fallback) {
  const saved = localStorage.getItem(key);
  if (saved === null) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return structuredClone(fallback);
  }
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Stored data is not a list.");
    return parsed;
  } catch (error) {
    console.error(`Could not read ${key} from local storage.`, error);
    return structuredClone(fallback);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(state.books));
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function isLibrarian() {
  return currentUser()?.role === "Librarian";
}

function notify(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("toast-error", isError);
  toast.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function setView(view) {
  state.activeView = view;
  document.querySelectorAll(".view-section").forEach((section) => {
    section.hidden = section.id !== `view-${view}`;
  });
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  const headings = { dashboard: "Overview", books: "Books", transactions: "Transactions", users: "Members" };
  $("#page-heading").textContent = headings[view];
  if (view === "books") renderBooks();
  if (view === "transactions") renderTransactions();
  if (view === "users") renderUsers();
}

function showApp() {
  const user = currentUser();
  $("#login-screen").hidden = Boolean(user);
  $("#app-shell").hidden = !user;
  if (!user) {
    state.currentUserId = null;
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    return;
  }
  $("#current-user-name").textContent = user.name;
  $("#current-user-avatar").textContent = user.name.trim().charAt(0).toUpperCase();
  document.querySelectorAll('[data-view="users"], [data-go="users"]').forEach((element) => {
    element.hidden = !isLibrarian();
  });
  if (!isLibrarian() && state.activeView === "users") state.activeView = "dashboard";
  setView(state.activeView);
  renderAll();
}

function bookCover(book, index) {
  return `<span class="book-cover cover-${index % 5}">${escapeHtml(book.title.trim().charAt(0).toUpperCase())}</span>`;
}

function stockLabel(quantity) {
  if (quantity === 0) return `<span class="stock-pill out">● Out of stock</span>`;
  if (quantity < 2) return `<span class="stock-pill low">● ${quantity} copy</span>`;
  return `<span class="stock-pill">● ${quantity} copies</span>`;
}

function renderDashboard() {
  const totalStock = state.books.reduce((total, book) => total + Number(book.quantity), 0);
  const borrowed = state.transactions.reduce((total, transaction) => {
    if (transaction.type === "borrow") return total + transaction.quantity;
    if (transaction.type === "return") return total - transaction.quantity;
    return total;
  }, 0);
  $("#stat-titles").textContent = state.books.length;
  $("#stat-stock").textContent = totalStock;
  $("#stat-borrowed").textContent = Math.max(0, borrowed);
  $("#stat-members").textContent = state.users.filter((user) => user.role === "Member").length;

  const dashboardBooks = $("#dashboard-books");
  dashboardBooks.innerHTML = state.books.slice(0, 5).map((book, index) => `
    <tr><td><div class="book-cell">${bookCover(book, index)}<span><span class="book-title">${escapeHtml(book.title)}</span><span class="book-author">${escapeHtml(book.author)}</span></span></div></td>
      <td><span class="genre-tag">${escapeHtml(book.genre)}</span></td><td>${stockLabel(Number(book.quantity))}</td></tr>`).join("");
  $("#dashboard-empty").hidden = state.books.length > 0;

  const lowStock = state.books.filter((book) => Number(book.quantity) < 2);
  $("#low-stock-count").textContent = lowStock.length;
  $("#low-stock-list").innerHTML = lowStock.slice(0, 5).map((book) => `
    <div class="low-stock-item"><span><span class="low-stock-title">${escapeHtml(book.title)}</span><span class="low-stock-author">${escapeHtml(book.author)}</span></span>
      <span class="low-stock-qty">${Number(book.quantity) === 0 ? "Out of stock" : `${Number(book.quantity)} left`}</span></div>`).join("");
  $("#low-stock-empty").hidden = lowStock.length > 0;

  const latestTransactions = [...state.transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  $("#dashboard-transactions").innerHTML = latestTransactions.map((transaction) => `
    <tr><td><span class="type-pill ${escapeHtml(transaction.type)}">${escapeHtml(transaction.type)}</span></td>
      <td>${escapeHtml(transaction.bookTitle)}</td><td>${escapeHtml(transaction.memberName || "—")}</td><td>${formatDate(transaction.createdAt, false)}</td></tr>`).join("");
  $("#dashboard-transactions-empty").hidden = latestTransactions.length > 0;
}

function renderBooks() {
  const search = $("#book-search").value.trim().toLowerCase();
  const books = state.books.filter((book) => [book.title, book.author, book.genre, book.isbn].some((value) => value.toLowerCase().includes(search)));
  $("#books-table").innerHTML = books.map((book, index) => `
    <tr><td><div class="book-cell">${bookCover(book, index)}<span><span class="book-title">${escapeHtml(book.title)}</span><span class="book-author">${escapeHtml(book.author)}</span></span></div></td>
      <td>${escapeHtml(book.genre)}</td><td>${escapeHtml(book.isbn)}</td><td>${stockLabel(Number(book.quantity))}</td>
      <td><div class="row-actions"><button class="small-action" data-edit-book="${escapeHtml(book.id)}" type="button">Update</button><button class="small-action danger" data-delete-book="${escapeHtml(book.id)}" type="button">Delete</button></div></td></tr>`).join("");
  $("#books-empty").hidden = books.length > 0;
  document.querySelectorAll("[data-edit-book], [data-delete-book]").forEach((button) => {
    button.disabled = !isLibrarian();
    button.hidden = !isLibrarian();
  });
}

function renderTransactions() {
  const availableBooks = state.books;
  $("#transaction-book").innerHTML = availableBooks.length
    ? availableBooks.map((book) => `<option value="${escapeHtml(book.id)}">${escapeHtml(book.title)} (${Number(book.quantity)} in stock)</option>`).join("")
    : `<option value="">Add a book first</option>`;
  const members = state.users.filter((user) => user.role === "Member");
  $("#transaction-member").innerHTML = members.length
    ? members.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} · ${escapeHtml(user.membershipId)}</option>`).join("")
    : `<option value="">No members registered</option>`;
  $("#transaction-member-field").hidden = $("#transaction-type").value === "stock";
  $("#transaction-book").disabled = availableBooks.length === 0;
  $("#transaction-member").disabled = members.length === 0;
  $("#transaction-submit").disabled = !isLibrarian() || availableBooks.length === 0;
  const transactions = [...state.transactions].sort((a, b) => b.createdAt - a.createdAt);
  $("#transactions-table").innerHTML = transactions.map((transaction) => `
    <tr><td><span class="type-pill ${escapeHtml(transaction.type)}">${escapeHtml(transaction.type)}</span></td>
      <td>${escapeHtml(transaction.bookTitle)}</td><td>${escapeHtml(transaction.memberName || "—")}</td>
      <td>${transaction.quantity}</td><td>${formatDate(transaction.createdAt, true)}</td></tr>`).join("");
  $("#transaction-total").textContent = `${transactions.length} ${transactions.length === 1 ? "record" : "records"}`;
  $("#transactions-empty").hidden = transactions.length > 0;
}

function renderUsers() {
  const users = state.users;
  $("#users-table").innerHTML = users.map((user) => `
    <tr><td><div class="book-cell"><span class="avatar">${escapeHtml(user.name.trim().charAt(0).toUpperCase())}</span><span class="book-title">${escapeHtml(user.name)}</span></div></td>
      <td>${escapeHtml(user.membershipId)}</td><td><span class="role-pill ${user.role === "Librarian" ? "librarian" : ""}">${escapeHtml(user.role)}</span></td>
      <td><div class="row-actions"><button class="small-action" data-edit-user="${escapeHtml(user.id)}" type="button">Update</button><button class="small-action danger" data-delete-user="${escapeHtml(user.id)}" type="button">Delete</button></div></td></tr>`).join("");
  $("#users-empty").hidden = users.length > 0;
  $("#user-total").textContent = `${users.length} ${users.length === 1 ? "member" : "members"}`;
  document.querySelectorAll("[data-edit-user], [data-delete-user]").forEach((button) => {
    button.disabled = !isLibrarian();
    button.hidden = !isLibrarian();
  });
}

function renderAll() {
  renderDashboard();
  renderBooks();
  renderTransactions();
  renderUsers();
}

function formatDate(timestamp, includeTime) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(date);
}

function resetBookForm() {
  $("#book-form").reset();
  $("#book-id").value = "";
  $("#book-quantity").value = "1";
  $("#book-form-title").textContent = "Add a new book";
}

function resetUserForm() {
  $("#user-form").reset();
  $("#user-id").value = "";
  $("#user-form-title").textContent = "Add a new member";
}

function openBookEditor(book) {
  $("#book-id").value = book.id;
  $("#book-title").value = book.title;
  $("#book-author").value = book.author;
  $("#book-genre").value = book.genre;
  $("#book-isbn").value = book.isbn;
  $("#book-quantity").value = book.quantity;
  $("#book-form-title").textContent = "Update book details";
  $("#book-form-panel").hidden = false;
  $("#book-form-panel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function openUserEditor(user) {
  $("#user-id").value = user.id;
  $("#user-name").value = user.name;
  $("#user-membership").value = user.membershipId;
  $("#user-role").value = user.role;
  $("#user-form-title").textContent = "Update member details";
  $("#user-form-panel").hidden = false;
  $("#user-form-panel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function normalizeIsbn(isbn) {
  return isbn.trim().replace(/[\s-]/g, "").toUpperCase();
}

document.querySelectorAll(".nav-link").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.go);
    if (button.dataset.go === "books") $("#book-form-panel").hidden = false;
  });
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.close);
    panel.hidden = true;
    if (button.dataset.close === "book-form-panel") resetBookForm();
    if (button.dataset.close === "user-form-panel") resetUserForm();
  });
});

$("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const membershipId = $("#login-membership").value.trim().toLowerCase();
  const user = state.users.find((candidate) => candidate.membershipId.toLowerCase() === membershipId);
  if (!user) {
    $("#login-error").textContent = "We couldn't find that membership ID. Check it and try again.";
    $("#login-error").hidden = false;
    return;
  }
  $("#login-error").hidden = true;
  state.currentUserId = user.id;
  localStorage.setItem(STORAGE_KEYS.currentUser, user.id);
  showApp();
});

$("#logout-button").addEventListener("click", () => {
  state.currentUserId = null;
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  $("#login-form").reset();
  $("#login-error").hidden = true;
  showApp();
});

$("#toggle-book-form").addEventListener("click", () => {
  resetBookForm();
  $("#book-form-panel").hidden = false;
  $("#book-form-panel").scrollIntoView({ behavior: "smooth", block: "center" });
});

$("#book-search").addEventListener("input", renderBooks);

$("#book-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isLibrarian()) return notify("Only librarians can manage books.", true);
  const id = $("#book-id").value;
  const isbn = normalizeIsbn($("#book-isbn").value);
  const duplicateIsbn = state.books.some((book) => book.id !== id && normalizeIsbn(book.isbn) === isbn);
  if (duplicateIsbn) return notify("A book with this ISBN is already in the collection.", true);
  const quantity = Number($("#book-quantity").value);
  if (!Number.isSafeInteger(quantity) || quantity < 0) return notify("Enter a whole-number quantity of zero or more.", true);
  const details = {
    title: $("#book-title").value.trim(),
    author: $("#book-author").value.trim(),
    genre: $("#book-genre").value.trim(),
    isbn,
    quantity
  };
  if (id) {
    const book = state.books.find((item) => item.id === id);
    if (!book) return notify("That book no longer exists. Refresh and try again.", true);
    Object.assign(book, details);
  } else {
    state.books.push({ id: makeId("book"), ...details });
  }
  persist();
  $("#book-form-panel").hidden = true;
  resetBookForm();
  renderAll();
  notify(id ? "Book details updated." : "Book added to the collection.");
});

$("#books-table").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-book]");
  const deleteButton = event.target.closest("[data-delete-book]");
  if (editButton) {
    const book = state.books.find((item) => item.id === editButton.dataset.editBook);
    if (book) openBookEditor(book);
  }
  if (deleteButton) {
    const book = state.books.find((item) => item.id === deleteButton.dataset.deleteBook);
    if (!book || !isLibrarian()) return;
    if (!confirm(`Delete "${book.title}" from the collection? Its transaction history will be kept.`)) return;
    state.books = state.books.filter((item) => item.id !== book.id);
    persist();
    renderAll();
    notify("Book removed from the collection.");
  }
});

$("#transaction-type").addEventListener("change", () => {
  const type = $("#transaction-type").value;
  $("#transaction-member-field").hidden = type === "stock";
  $("#transaction-submit").textContent = {
    borrow: "Record borrowing", return: "Record return", stock: "Add to stock"
  }[type];
});

$("#transaction-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isLibrarian()) return notify("Only librarians can record transactions.", true);
  const book = state.books.find((item) => item.id === $("#transaction-book").value);
  if (!book) return notify("Select a book before recording a transaction.", true);
  const quantity = Number($("#transaction-quantity").value);
  if (!Number.isSafeInteger(quantity) || quantity < 1) return notify("Enter a whole-number quantity greater than zero.", true);
  const type = $("#transaction-type").value;
  let member = null;
  if (type !== "stock") {
    member = state.users.find((user) => user.id === $("#transaction-member").value && user.role === "Member");
    if (!member) return notify("Select a registered member for this transaction.", true);
  }
  if (type === "borrow" && quantity > book.quantity) {
    return notify(`Only ${book.quantity} ${book.quantity === 1 ? "copy is" : "copies are"} currently in stock.`, true);
  }
  if (type === "return") {
    const outstanding = state.transactions.reduce((total, transaction) => {
      if (transaction.bookId !== book.id || transaction.memberId !== member.id) return total;
      if (transaction.type === "borrow") return total + transaction.quantity;
      if (transaction.type === "return") return total - transaction.quantity;
      return total;
    }, 0);
    if (quantity > outstanding) return notify(`${member.name} has only ${Math.max(0, outstanding)} outstanding ${Math.max(0, outstanding) === 1 ? "copy" : "copies"} of this title.`, true);
  }
  book.quantity += type === "borrow" ? -quantity : quantity;
  state.transactions.push({
    id: makeId("transaction"),
    type,
    bookId: book.id,
    bookTitle: book.title,
    memberId: member?.id || null,
    memberName: member?.name || null,
    quantity,
    createdAt: Date.now()
  });
  persist();
  $("#transaction-form").reset();
  $("#transaction-type").value = "borrow";
  $("#transaction-quantity").value = "1";
  $("#transaction-member-field").hidden = false;
  $("#transaction-submit").textContent = "Record borrowing";
  renderAll();
  notify(type === "stock" ? "New stock added." : type === "return" ? "Book return recorded." : "Borrowing recorded.");
});

$("#toggle-user-form").addEventListener("click", () => {
  resetUserForm();
  $("#user-form-panel").hidden = false;
  $("#user-form-panel").scrollIntoView({ behavior: "smooth", block: "center" });
});

$("#user-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isLibrarian()) return notify("Only librarians can manage members.", true);
  const id = $("#user-id").value;
  const membershipId = $("#user-membership").value.trim();
  const duplicateId = state.users.some((user) => user.id !== id && user.membershipId.toLowerCase() === membershipId.toLowerCase());
  if (duplicateId) return notify("That membership ID is already in use.", true);
  const details = {
    name: $("#user-name").value.trim(),
    membershipId,
    role: $("#user-role").value
  };
  if (id) {
    const user = state.users.find((item) => item.id === id);
    if (!user) return notify("That member no longer exists. Refresh and try again.", true);
    if (user.id === state.currentUserId && details.role !== "Librarian") {
      return notify("You cannot remove your own librarian access while signed in.", true);
    }
    Object.assign(user, details);
  } else {
    state.users.push({ id: makeId("user"), ...details });
  }
  persist();
  $("#user-form-panel").hidden = true;
  resetUserForm();
  showApp();
  notify(id ? "Member details updated." : "Member added.");
});

$("#users-table").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-user]");
  const deleteButton = event.target.closest("[data-delete-user]");
  if (editButton) {
    const user = state.users.find((item) => item.id === editButton.dataset.editUser);
    if (user) openUserEditor(user);
  }
  if (deleteButton) {
    const user = state.users.find((item) => item.id === deleteButton.dataset.deleteUser);
    if (!user || !isLibrarian()) return;
    if (user.id === state.currentUserId) return notify("You cannot delete the account you're currently signed in with.", true);
    if (user.role === "Librarian" && state.users.filter((item) => item.role === "Librarian").length === 1) {
      return notify("At least one librarian account must remain.", true);
    }
    if (!confirm(`Delete ${user.name} (${user.membershipId})? Transaction history will be kept.`)) return;
    state.users = state.users.filter((item) => item.id !== user.id);
    persist();
    renderAll();
    notify("Member removed.");
  }
});

showApp();
