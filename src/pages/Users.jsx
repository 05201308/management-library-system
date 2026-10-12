import { useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { createId } from "../lib/storage.js";

const blankUser = { name: "", membershipId: "", role: "Member" };

export default function Users() {
  const { users, setUsers, currentUser } = useLibrary();
  const [form, setForm] = useState(blankUser);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  function setError(text) {
    setMessage(text);
    setMessageType("error");
  }

  function setSuccess(text) {
    setMessage(text);
    setMessageType("success");
  }

  function submitUser(event) {
    event.preventDefault();
    const membershipId = form.membershipId.trim().toUpperCase();
    const remainingAdmins = users.filter((user) => user.role === "Admin" && user.id !== editingId);
    if (editingId === currentUser.id && form.role !== "Admin" && remainingAdmins.length === 0) {
      setError("Add another administrator before changing your own role.");
      return;
    }
    if (users.some((user) => user.membershipId.toLowerCase() === membershipId.toLowerCase() && user.id !== editingId)) {
      setError("That membership ID is already in use.");
      return;
    }
    if (editingId) {
      setUsers((items) => items.map((user) => user.id === editingId ? { ...user, ...form, name: form.name.trim(), membershipId } : user));
      setSuccess("Member details updated.");
    } else {
      setUsers((items) => [{ ...form, name: form.name.trim(), membershipId, id: createId() }, ...items]);
      setSuccess("Member added.");
    }
    setForm(blankUser);
    setEditingId(null);
  }

  function editUser(user) {
    setForm({ name: user.name, membershipId: user.membershipId, role: user.role });
    setEditingId(user.id);
    setMessage("");
    setMessageType("success");
  }

  function deleteUser(user) {
    if (user.id === currentUser.id) {
      setError("You cannot remove the account you're currently signed in with.");
      return;
    }
    if (user.role === "Admin" && users.filter((item) => item.role === "Admin").length === 1) {
      setError("The library needs at least one administrator.");
      return;
    }
    if (!window.confirm(`Remove ${user.name} from the member list?`)) return;
    setUsers((items) => items.filter((item) => item.id !== user.id));
    if (editingId === user.id) { setEditingId(null); setForm(blankUser); }
    setSuccess(`${user.name} was removed.`);
  }

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="OUR NEIGHBORHOOD" title="Members" description="The people who make this library a community." action={<span className="count-chip">{users.length} accounts</span>} />
      <div className="collection-layout">
        <section className="panel form-panel">
          <div className="panel-heading"><div><div className="eyebrow">{editingId ? "KEEP THINGS CURRENT" : "WELCOME A NEW READER"}</div><h2>{editingId ? "Update account" : "Add a member"}</h2></div></div>
          <form className="form-stack" onSubmit={submitUser}>
            <label htmlFor="user-name">Full name</label><input id="user-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength="100" placeholder="e.g. Taylor James" />
            <label htmlFor="user-membership">Membership ID</label><input id="user-membership" value={form.membershipId} onChange={(event) => setForm({ ...form, membershipId: event.target.value })} required pattern="[A-Za-z0-9-]{3,24}" title="Use 3–24 letters, numbers, or hyphens." placeholder="e.g. MEM-1026" />
            <label htmlFor="user-role">Role</label><select id="user-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option>Member</option><option>Admin</option></select>
            {message && <p className={messageType === "error" ? "form-error" : "form-success"} role={messageType === "error" ? "alert" : "status"}>{message}</p>}
            <div className="form-buttons"><button className="button button-primary button-wide" type="submit">{editingId ? "Save changes" : "Add member"} <span>→</span></button>{editingId && <button className="button button-quiet button-wide" type="button" onClick={() => { setEditingId(null); setForm(blankUser); setMessage(""); }}>Cancel</button>}</div>
          </form>
          <p className="form-footnote">Demo accounts sign in with their membership ID only.</p>
        </section>
        <section className="panel collection-panel">
          <div className="panel-heading"><div><div className="eyebrow">THE NEIGHBORHOOD</div><h2>Library accounts</h2></div></div>
          {users.length ? <div className="table-scroll"><table><thead><tr><th>MEMBER</th><th>MEMBERSHIP ID</th><th>ROLE</th><th>MANAGE</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="member-cell"><span className="avatar avatar-table">{user.name.slice(0, 1).toUpperCase()}</span><strong>{user.name}</strong></div></td><td>{user.membershipId}</td><td><span className={`role-tag ${user.role === "Admin" ? "role-admin" : ""}`}>{user.role}</span></td><td><div className="table-actions"><button className="text-button" onClick={() => editUser(user)}>Update</button><button className="text-button danger-text" onClick={() => deleteUser(user)}>Delete</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No accounts yet" description="Add a member to start growing your library community." />}
        </section>
      </div>
    </div>
  );
}
