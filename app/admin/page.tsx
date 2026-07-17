"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FeedbackEntry, ratings } from "@/lib/feedback";

const PAGE_SIZE = 10;

function pageRange(currentPage: number, totalPages: number) {
  const pages = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous && page - previous > 1 ? ["ellipsis", page] : [page];
  });
}

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  const dateFiltered = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return entries.filter((entry) => {
      const createdAt = new Date(entry.createdAt);
      return (!from || createdAt >= from) && (!to || createdAt <= to);
    });
  }, [dateFrom, dateTo, entries]);

  const filtered = useMemo(() => {
    if (filter === "all") return dateFiltered;
    return dateFiltered.filter((entry) => entry.rating === Number(filter));
  }, [dateFiltered, filter]);

  const average = dateFiltered.length
    ? (
        dateFiltered.reduce((total, entry) => total + entry.rating, 0) / dateFiltered.length
      ).toFixed(1)
    : "0.0";

  const excellent = dateFiltered.filter((entry) => entry.rating === 5).length;
  const needsAttention = dateFiltered.filter((entry) => entry.rating <= 2).length;
  const distribution = ratings.map((rating) => {
    const count = dateFiltered.filter((entry) => entry.rating === rating.value).length;
    return {
      ...rating,
      count,
      percentage: dateFiltered.length ? Math.round((count / dateFiltered.length) * 100) : 0
    };
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedEntries = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const paginationPages = pageRange(currentPage, totalPages);

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
          <strong>{dateFiltered.length}</strong>
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
          <span>{dateFiltered.length} responses in selected period</span>
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
        <div className="filter-group">
          <label className="filter-control">
            <span>Show</span>
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All ratings</option>
              <option value="5">Excellent only</option>
              <option value="4">Good only</option>
              <option value="3">Okay only</option>
              <option value="2">Poor only</option>
              <option value="1">Very poor only</option>
            </select>
          </label>

          <label className="filter-control">
            <span>From</span>
            <input
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setCurrentPage(1);
              }}
              type="date"
              value={dateFrom}
            />
          </label>

          <label className="filter-control">
            <span>To</span>
            <input
              min={dateFrom || undefined}
              onChange={(event) => {
                setDateTo(event.target.value);
                setCurrentPage(1);
              }}
              type="date"
              value={dateTo}
            />
          </label>

          <button
            className="clear-filter"
            disabled={!dateFrom && !dateTo}
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setCurrentPage(1);
            }}
            type="button"
          >
            Clear dates
          </button>
        </div>

        <button
          className="primary-button"
          disabled={!filtered.length}
          onClick={exportCsv}
          type="button"
        >
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
              {paginatedEntries.map((entry) => (
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
          <div className="empty">No feedback matches the selected filters.</div>
        )}
      </section>

      {!loading && !error && filtered.length ? (
        <nav className="pagination" aria-label="Feedback table pagination">
          <p>
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>

          <div className="pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              type="button"
            >
              Previous
            </button>

            {paginationPages.map((page, index) =>
              typeof page === "string" ? (
                <span aria-hidden="true" key={`ellipsis-${index}`}>…</span>
              ) : (
                <button
                  aria-current={currentPage === page ? "page" : undefined}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  type="button"
                >
                  {page}
                </button>
              )
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </main>
  );
}
