"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FeedbackEntry, ratings } from "@/lib/feedback";

function toCsv(entries: FeedbackEntry[]) {
  const headers = ["Date", "Rating", "Label"];
  const rows = entries.map((entry) => [
    new Date(entry.createdAt).toLocaleString(),
    entry.rating,
    entry.label
  ]);

  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");
}

export default function AdminDashboard() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFeedback() {
      try {
        const response = await fetch("/api/feedback", { cache: "no-store" });
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!response.ok) throw new Error("Unable to load feedback.");

        const data = (await response.json()) as { entries: FeedbackEntry[] };
        setEntries(data.entries);
      } catch {
        setError("Feedback data could not be loaded. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadFeedback();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((entry) => entry.rating === Number(filter));
  }, [entries, filter]);

  const average = entries.length
    ? (entries.reduce((total, entry) => total + entry.rating, 0) / entries.length).toFixed(1)
    : "0.0";

  const excellent = entries.filter((entry) => entry.rating === 5).length;
  const needsAttention = entries.filter((entry) => entry.rating <= 2).length;
  const distribution = ratings.map((rating) => {
    const count = entries.filter((entry) => entry.rating === rating.value).length;
    return {
      ...rating,
      count,
      percentage: entries.length ? Math.round((count / entries.length) * 100) : 0
    };
  });

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "frontdesk-feedback.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Feedback Dashboard</h1>
          <p>Review frontdesk ratings and export reports for Excel.</p>
        </div>
        <div className="admin-actions">
          <Link className="secondary-button" href="/">
            Open Kiosk
          </Link>
          <button className="secondary-button" onClick={logout} type="button">
            Sign Out
          </button>
        </div>
      </header>

      <section className="summary-grid" aria-label="Feedback summary">
        <article className="summary-card">
          <span>Total Responses</span>
          <strong>{entries.length}</strong>
        </article>
        <article className="summary-card">
          <span>Average Rating</span>
          <strong>{average}</strong>
        </article>
        <article className="summary-card">
          <span>Excellent</span>
          <strong>{excellent}</strong>
        </article>
        <article className="summary-card">
          <span>Needs Attention</span>
          <strong>{needsAttention}</strong>
        </article>
      </section>

      <section className="chart-card" aria-labelledby="distribution-heading">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Rating overview</p>
            <h2 id="distribution-heading">Response distribution</h2>
          </div>
          <span>{entries.length} total responses</span>
        </div>

        <div className="distribution-chart">
          {distribution.map((rating) => (
            <div className="chart-row" key={rating.value}>
              <div className="chart-label">
                <Image
                  alt=""
                  aria-hidden="true"
                  height={34}
                  src={rating.image}
                  width={34}
                />
                <span>{rating.label}</span>
              </div>
              <div
                aria-label={`${rating.label}: ${rating.count} responses, ${rating.percentage}%`}
                className="chart-track"
                role="img"
              >
                <span style={{ width: `${rating.percentage}%` }} />
              </div>
              <strong>{rating.count}</strong>
              <span className="chart-percentage">{rating.percentage}%</span>
            </div>
          ))}
        </div>
      </section>

      <div className="toolbar">
        <label className="filter-control">
          <span>Show</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All ratings</option>
            <option value="5">Excellent only</option>
            <option value="4">Good only</option>
            <option value="3">Okay only</option>
            <option value="2">Poor only</option>
            <option value="1">Very poor only</option>
          </select>
        </label>

        <button className="primary-button" onClick={exportCsv} type="button">
          Export CSV
        </button>
      </div>

      <section className="table-wrap">
        {loading ? (
          <div className="empty">Loading feedback...</div>
        ) : error ? (
          <div className="empty error-state" role="alert">{error}</div>
        ) : filtered.length ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`score score-${entry.rating}`}>
                      {entry.emoji} {entry.rating}/5
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No feedback yet.</div>
        )}
      </section>
    </main>
  );
}
