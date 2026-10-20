import React, { useState, useEffect, useRef } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Software Engineer AI");
  const [location, setLocation] = useState("India");
  const [resumeInfo, setResumeInfo] = useState({ exists: false, size_kb: 0 });
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const prevStatusRef = useRef({});

  const addToast = (title, message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  };

  const fetchResumeStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/resume/status`);
      const data = await res.json();
      setResumeInfo(data);
    } catch (e) {}
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs`);
      const data = await res.json();

      // Trigger pop-up when a job transitions to applied or failed
      data.forEach((job) => {
        const prev = prevStatusRef.current[job.id];
        if (prev === "in_progress" && job.status === "applied") {
          addToast(
            `🎉 Applied to ${job.company}!`,
            `${job.title} was submitted using your resume.`,
            "success"
          );
        } else if (prev === "in_progress" && job.status === "failed") {
          addToast(
            `⚠️ Action Needed: ${job.company}`,
            job.step || "Check the Chrome window.",
            "error"
          );
        }
        prevStatusRef.current[job.id] = job.status;
      });

      setJobs(data);
    } catch (err) {
      console.error("Backend offline", err);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`${BACKEND_URL}/api/resume/upload`, {
      method: "POST",
      body: formData,
    });
    await fetchResumeStatus();
    addToast("✅ Resume Updated!", `${file.name} is now set as your active resume.`, "success");
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
      addToast("🔍 Jobs Scraped", `Found latest ${role} openings.`, "success");
    } catch (err) {
      alert("Cannot reach backend at " + BACKEND_URL);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    prevStatusRef.current[id] = "in_progress";
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: "in_progress", step: "Starting AI Browser Agent..." } : j
      )
    );
    await fetch(`${BACKEND_URL}/api/apply/${id}`, { method: "POST" });
  };

  useEffect(() => {
    fetchJobs();
    fetchResumeStatus();
    const timer = setInterval(fetchJobs, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ maxWidth: 920, margin: "32px auto", fontFamily: "system-ui, sans-serif", padding: 20 }}>
      {/* POP-UP TOAST NOTIFICATIONS */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: t.type === "error" ? "#7f1d1d" : "#065f46",
              border: `1px solid ${t.type === "error" ? "#ef4444" : "#10b981"}`,
              color: "#fff",
              padding: "14px 18px",
              borderRadius: 10,
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              minWidth: 300,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{t.message}</div>
          </div>
        ))}
      </div>

      {/* HEADER & RESUME CONTROLS */}
      <header style={{ marginBottom: 24, borderBottom: "1px solid #334155", paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: "bold", margin: "0 0 6px 0" }}>Ishan Rai — AutoApply Command Center</h1>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
            Backend: <code style={{ color: "#38bdf8" }}>{BACKEND_URL}</code> • Model: <code style={{ color: "#a855f7" }}>gemini-3.8-flash</code>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setShowResumeModal(true)}
            style={{
              background: "#1e293b",
              color: "#38bdf8",
              border: "1px solid #38bdf8",
              padding: "9px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            📄 {resumeInfo.exists ? `View My Resume (${resumeInfo.size_kb} KB)` : "Upload Resume PDF"}
          </button>

          <label
            style={{
              background: "#334155",
              color: "#fff",
              padding: "9px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            🔄 Change PDF
            <input type="file" accept="application/pdf" onChange={handleResumeUpload} style={{ display: "none" }} />
          </label>
        </div>
      </header>

      {/* RESUME PREVIEW MODAL */}
      {showResumeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <div style={{ background: "#1e293b", width: "90%", maxWidth: 850, height: "85vh", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #475569" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ color: "#f8fafc" }}>Active Resume Preview (Ishan_Rai_Resume.pdf)</strong>
              <button onClick={() => setShowResumeModal(false)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}>
                Close ✕
              </button>
            </div>
            <div style={{ flex: 1, background: "#0f172a" }}>
              {resumeInfo.exists ? (
                <iframe src={`${BACKEND_URL}/api/resume`} title="Resume Preview" width="100%" height="100%" style={{ border: "none" }} />
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                  <p>No <code>resume_master.pdf</code> found in backend folder yet.</p>
                  <p>Click <b>"🔄 Change PDF"</b> in the top bar and select your <b>Ishan_Rai_Resume (12).pdf</b> file!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Target Role (e.g., AI Engineer, Python Developer)"
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

      {/* JOB CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              padding: 18,
              borderRadius: 10,
              border: job.status === "applied" ? "1px solid #16a34a" : job.status === "failed" ? "1px solid #ef4444" : "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#1e293b",
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 17, color: "#f8fafc" }}>{job.title}</h3>
              <p style={{ margin: "0 0 6px 0", color: "#94a3b8", fontSize: 14 }}>
                {job.company} • {job.location}
              </p>
              <div style={{ fontSize: 12, color: job.status === "failed" ? "#f87171" : "#38bdf8", marginBottom: 8 }}>
                Status: {job.step || job.status}
              </div>
              <a href={job.job_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "underline" }}>
                Open Job Posting ↗
              </a>
            </div>

            <div>
              {(job.status === "pending" || job.status === "failed") && (
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
                  {job.status === "failed" ? "Retry Auto-Apply" : "Approve & Auto-Apply"}
                </button>
              )}
              {job.status === "in_progress" && (
                <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: 14, textAlign: "right" }}>
                  ⚙️ Agent Active...
                  <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>Watch Chrome Window</div>
                </div>
              )}
              {job.status === "applied" && (
                <span style={{ background: "#065f46", color: "#34d399", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                  ✅ Applied!
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
