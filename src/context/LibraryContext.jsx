import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage.js";

const initialBooks = [
  { id: "b-1", title: "The Night Circus", author: "Erin Morgenstern", genre: "Fiction", isbn: "9780307744432", quantity: 4 },
  { id: "b-2", title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", genre: "Nature", isbn: "9781571313560", quantity: 1 },
  { id: "b-3", title: "Small Things Like These", author: "Claire Keegan", genre: "Literary fiction", isbn: "9780802158741", quantity: 2 },
  { id: "b-4", title: "The Creative Act", author: "Rick Rubin", genre: "Art & creativity", isbn: "9780593652886", quantity: 0 },
  { id: "b-5", title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", genre: "Fiction", isbn: "9780593321201", quantity: 3 },
];

const initialUsers = [
  { id: "u-1", name: "Library Admin", membershipId: "LIB-001", role: "Admin" },
  { id: "u-2", name: "Alex Morgan", membershipId: "MEM-1024", role: "Member" },
  { id: "u-3", name: "Sam Rivera", membershipId: "MEM-1025", role: "Member" },
];

const LibraryContext = createContext(null);

function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => readStorage(key, initialValue));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}

export function LibraryProvider({ children }) {
  const [books, setBooks] = usePersistedState(STORAGE_KEYS.books, initialBooks);
  const [users, setUsers] = usePersistedState(STORAGE_KEYS.users, initialUsers);
  const [transactions, setTransactions] = usePersistedState(STORAGE_KEYS.transactions, []);
  const [sessionId, setSessionId] = usePersistedState(STORAGE_KEYS.session, null);

  const currentUser = users.find((user) => user.id === sessionId) ?? null;
  const value = useMemo(
    () => ({ books, setBooks, users, setUsers, transactions, setTransactions, currentUser, setSessionId }),
    [books, users, transactions, currentUser, setBooks, setUsers, setTransactions, setSessionId],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used inside LibraryProvider");
  return context;
}
