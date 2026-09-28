import { useEffect, useState } from "react";

const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "",
  prompt_text: "",
  response_summary: "",
  category: "",
  usefulness: "",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

function LandingPage() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <main className="page">
      <section className="container">
        <section className="panel">
          <p className="eyebrow">AI Prompt Manager</p>

          <h1>AI Capsule</h1>

          <p className="subtitle">
            Save, review and improve useful AI prompts in your private capsule
            library.
          </p>

          <div className="button-row landing-buttons">
            <button onClick={handleLogin}>Login with GitHub</button>
          </div>
        </section>
      </section>
    </main>
  );
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");

  const loadCapsules = async () => {
    try {
      const response = await fetch("/api/capsules");

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load capsules");
      }

      const data = await response.json();
      setCapsules(data);
    } catch (error) {
      console.error(error);
      setStatus("Failed to load capsules");
    }
  };

  const checkAuthentication = async () => {
    try {
      const response = await fetch("/api/auth/me");

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error("Authentication check failed");
      }

      const data = await response.json();

      setUser(data);

      await loadCapsules();
    } catch (error) {
      console.error(error);
      window.location.href = "/";
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const url = editingId
      ? `/api/capsules/${editingId}`
      : "/api/capsules";

    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setStatus(
        editingId
          ? "Capsule updated successfully"
          : "Capsule created successfully"
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadCapsules();
    } catch (error) {
      console.error(error);
      setStatus(error.message);
    }
  };

  const handleEdit = (capsule) => {
    setEditingId(capsule.id);

    setForm({
      project_name: capsule.project_name || "",
      prompt_title: capsule.prompt_title || "",
      prompt_version: capsule.prompt_version || "",
      prompt_text: capsule.prompt_text || "",
      response_summary: capsule.response_summary || "",
      category: capsule.category || "",
      usefulness: capsule.usefulness || "",
      reviewed: Boolean(capsule.reviewed),
      improved: Boolean(capsule.improved),
      screenshot_url: capsule.screenshot_url || "",
      notes: capsule.notes || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setStatus("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this capsule?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/capsules/${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setStatus("Capsule deleted successfully");

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      await loadCapsules();
    } catch (error) {
      console.error(error);
      setStatus(error.message);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/";
  };

  if (checkingAuth) {
    return (
      <main className="page">
        <section className="container">
          <section className="panel">
            <p>Checking authentication...</p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div>
            <p className="eyebrow">Prompt Manager</p>

            <h1>AI Capsule</h1>

            <p className="subtitle">
              Signed in as <strong>{user?.username}</strong>
            </p>
          </div>

          <button className="secondary" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <section className="panel">
          <h2>{editingId ? "Edit Capsule" : "Create Capsule"}</h2>

          <form className="form" onSubmit={handleSubmit}>
            <label>
              Project name
              <input
                name="project_name"
                value={form.project_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Prompt title
              <input
                name="prompt_title"
                value={form.prompt_title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Prompt version
              <input
                name="prompt_version"
                value={form.prompt_version}
                onChange={handleChange}
                placeholder="v1"
              />
            </label>

            <label>
              Prompt text
              <textarea
                name="prompt_text"
                value={form.prompt_text}
                onChange={handleChange}
                rows="5"
                required
              />
            </label>

            <label>
              Response summary
              <textarea
                name="response_summary"
                value={form.response_summary}
                onChange={handleChange}
                rows="3"
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                <option value="Coding">Coding</option>
                <option value="Writing">Writing</option>
                <option value="Research">Research</option>
                <option value="Study">Study</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Usefulness
              <select
                name="usefulness"
                value={form.usefulness}
                onChange={handleChange}
              >
                <option value="">Select usefulness</option>
                <option value="Good">Good</option>
                <option value="Needs Improvement">
                  Needs Improvement
                </option>
              </select>
            </label>

            <label>
              Screenshot URL
              <input
                name="screenshot_url"
                value={form.screenshot_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
              />
            </label>

            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="reviewed"
                  checked={form.reviewed}
                  onChange={handleChange}
                />
                Reviewed
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="improved"
                  checked={form.improved}
                  onChange={handleChange}
                />
                Improved
              </label>
            </div>

            <div className="button-row">
              <button type="submit">
                {editingId ? "Update Capsule" : "Create Capsule"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          {status && <p className="status">{status}</p>}
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Saved Capsules</h2>
            <span>{capsules.length}</span>
          </div>

          {capsules.length === 0 ? (
            <p>No capsules saved yet.</p>
          ) : (
            <div className="capsule-list">
              {capsules.map((capsule) => (
                <article className="capsule-card" key={capsule.id}>
                  <div className="card-heading">
                    <div>
                      <h3>{capsule.prompt_title}</h3>

                      <p>
                        {capsule.project_name}
                        {capsule.prompt_version
                          ? ` · ${capsule.prompt_version}`
                          : ""}
                      </p>
                    </div>

                    <div className="card-actions">
                      <button
                        className="secondary"
                        onClick={() => handleEdit(capsule)}
                      >
                        Edit
                      </button>

                      <button
                        className="danger"
                        onClick={() => handleDelete(capsule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p>
                    <strong>Prompt:</strong>
                  </p>

                  <p>{capsule.prompt_text}</p>

                  {capsule.response_summary && (
                    <>
                      <p>
                        <strong>Response summary:</strong>
                      </p>

                      <p>{capsule.response_summary}</p>
                    </>
                  )}

                  <div className="meta">
                    <span>
                      Category: {capsule.category || "—"}
                    </span>

                    <span>
                      Usefulness: {capsule.usefulness || "—"}
                    </span>

                    <span>
                      Reviewed: {capsule.reviewed ? "Yes" : "No"}
                    </span>

                    <span>
                      Improved: {capsule.improved ? "Yes" : "No"}
                    </span>
                  </div>

                  {capsule.notes && (
                    <p>
                      <strong>Notes:</strong> {capsule.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function App() {
  const path = window.location.pathname;

  if (path === "/dashboard") {
    return <Dashboard />;
  }

  return <LandingPage />;
}

export default App;