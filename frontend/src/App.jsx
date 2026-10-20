import React, { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Software Engineer AI");
  const [location, setLocation] = useState("India");

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error("Backend offline", err);
    }
  };

  const scrapeJobs = async () => {
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, results_wanted: 5 }),
      });
      await fetchJobs();
    } catch (err) {
      alert("Cannot reach backend at " + BACKEND_URL);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: "in_progress" } : j))
    );
    await fetch(`${BACKEND_URL}/api/apply/${id}`, { method: "POST" });
  };

  useEffect(() => {
    fetchJobs();
    const timer = setInterval(fetchJobs, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ maxWidth: 880, margin: "40px auto", fontFamily: "system-ui, sans-serif", padding: 20 }}>
      <header style={{ marginBottom: 28, borderBottom: "1px solid #334155", paddingBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: "bold", margin: "0 0 6px 0" }}>Ishan Rai — AutoApply HITL</h1>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: 14 }}>
          Connected to: <code style={{ color: "#38bdf8" }}>{BACKEND_URL}</code> | Profile: VIT Bhopal CSE '27
        </p>
      </header>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Target Role (e.g., AI Engineer, Product Manager)"
          style={{ flex: 2, padding: "12px 14px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
        />
        <button
          onClick={scrapeJobs}
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "12px 22px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Scraping..." : "Scrape Jobs"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {jobs.length === 0 && !loading && (
          <div style={{ padding: 40, textAlign: "center", background: "#1e293b", borderRadius: 8, color: "#94a3b8" }}>
            No pending jobs in queue. Click <b>Scrape Jobs</b> to pull fresh listings.
          </div>
        )}
        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              padding: 18,
              borderRadius: 10,
              border: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#1e293b",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 17, color: "#f8fafc" }}>{job.title}</h3>
              <p style={{ margin: "0 0 8px 0", color: "#94a3b8", fontSize: 14 }}>
                {job.company} • {job.location}
              </p>
              <a href={job.job_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#38bdf8", textDecoration: "none" }}>
                Open Job Posting ↗
              </a>
            </div>

            <div>
              {job.status === "pending" && (
                <button
                  onClick={() => handleApply(job.id)}
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Approve & Auto-Apply
                </button>
              )}
              {job.status === "in_progress" && (
                <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 14 }}>⚙️ Tailoring PDF & Filling Form...</span>
              )}
              {job.status === "applied" && (
                <span style={{ color: "#22c55e", fontWeight: 600, fontSize: 14 }}>✅ Applied</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
