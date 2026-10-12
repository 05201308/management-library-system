import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext.jsx";

export default function Login() {
  const { users, currentUser, setSessionId } = useLibrary();
  const navigate = useNavigate();
  const [membershipId, setMembershipId] = useState("");
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to="/" replace />;

  function handleSubmit(event) {
    event.preventDefault();
    const user = users.find((item) => item.membershipId.toLowerCase() === membershipId.trim().toLowerCase());
    if (!user) {
      setError("We couldn't find that membership ID. Check it and try again.");
      return;
    }
    setError("");
    setSessionId(user.id);
    navigate("/");
  }

  return (
    <main className="login-page">
      <div className="login-decoration"><span className="decoration-orbit orbit-one" /><span className="decoration-orbit orbit-two" /><span className="decoration-leaf">✳</span></div>
      <section className="login-card">
        <a className="brand login-brand" href="/"><span className="brand-mark">c.</span><span><strong>commonplace</strong><small>COMMUNITY LIBRARY</small></span></a>
        <div className="eyebrow">WELCOME BACK</div>
        <h1>Your next chapter<br />starts here.</h1>
        <p className="login-intro">Sign in with your library membership ID to explore the collection.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <label htmlFor="membership-login">Membership ID</label>
          <input id="membership-login" autoComplete="username" value={membershipId} onChange={(event) => setMembershipId(event.target.value)} placeholder="e.g. LIB-001" required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit">Enter the library <span aria-hidden="true">→</span></button>
        </form>
        <div className="login-hint"><span>TRY A DEMO ACCOUNT</span><button type="button" onClick={() => setMembershipId("LIB-001")}>LIB-001 <span>Administrator</span></button><button type="button" onClick={() => setMembershipId("MEM-1024")}>MEM-1024 <span>Member</span></button></div>
        <p className="login-footnote">Demo sign-in uses membership ID only. Authentication is stored in this browser.</p>
      </section>
      <footer className="login-footer">A little neighborhood, a lot of stories. <span>✳</span></footer>
    </main>
  );
}
