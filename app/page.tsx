"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ratings } from "@/lib/feedback";

type FormState = {
  rating: number | null;
};

const initialForm: FormState = {
  rating: null
};

export default function FeedbackKiosk() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "saving" | "thanks" | "error">("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selected = useMemo(
    () => ratings.find((rating) => rating.value === form.rating),
    [form.rating]
  );

  useEffect(() => {
    if (status !== "thanks") return;

    const timeout = window.setTimeout(() => {
      setForm(initialForm);
      setStatus("idle");
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    const updateFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.fullscreenEnabled) {
      await document.documentElement.requestFullscreen();
    }
  }

  async function submitFeedback(event?: FormEvent) {
    event?.preventDefault();
    if (!selected || status === "saving") return;

    setStatus("saving");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error("Unable to save feedback");
      }

      setStatus("thanks");
    } catch {
      setStatus("error");
    }
  }

  if (status === "thanks") {
    return (
      <main className="kiosk-shell">
        <section className="feedback-panel thank-you">
          <h1>Thank You!</h1>
          <p>Your feedback has been recorded.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="kiosk-shell">
      <div className="kiosk-actions">
        <button
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          aria-pressed={isFullscreen}
          className="kiosk-action-button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          type="button"
        >
          {isFullscreen ? (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
            </svg>
          )}
        </button>
        <a
          aria-label="Open admin portal"
          className="kiosk-action-button"
          href="/admin"
          title="Admin portal"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
            <path d="m19.4 15 .1.1 1.3 2.2-2.1 2.1-2.2-1.3-.1-.1c-.5.3-1 .5-1.6.7V21h-3v-2.5a7 7 0 0 1-1.7-.7l-.1.1-2.2 1.3-2.1-2.1 1.3-2.2.1-.1a7 7 0 0 1-.7-1.7H3v-3h2.5c.2-.6.4-1.2.7-1.7l-.1-.1-1.3-2.2L6.9 4l2.2 1.3.1.1c.5-.3 1-.5 1.7-.7V3h3v1.6c.6.2 1.1.4 1.6.7l.1-.1L17.8 4l2.1 2.1-1.3 2.2-.1.1c.3.5.5 1 .7 1.7H21v3h-1.6c-.2.7-.4 1.3-.7 1.8Z" />
          </svg>
        </a>
      </div>
      <form className="feedback-panel" onSubmit={submitFeedback}>
        <div className="kiosk-brand" aria-label="HRMDO and Ateneo de Davao University">
          <Image
            alt="HRMDO logo"
            className="brand-logo hr-logo"
            height={72}
            priority
            src="/hr-logo.jpeg"
            width={72}
          />
          <Image
            alt="Ateneo de Davao University logo"
            className="brand-logo"
            height={72}
            priority
            src="/ateneo-logo.jpg"
            width={72}
          />
        </div>
        <p className="office-label">Office Service Feedback</p>
        <h1>How would you rate your experience today?</h1>

        <div className="ratings" role="radiogroup" aria-label="Service rating">
          {ratings.map((rating) => (
            <button
              aria-checked={form.rating === rating.value}
              className="rating-button"
              key={rating.value}
              onClick={() => setForm((current) => ({ ...current, rating: rating.value }))}
              role="radio"
              type="button"
            >
              <Image
                alt=""
                aria-hidden="true"
                className="emoji"
                height={512}
                src={rating.image}
                width={512}
              />
              <span className="rating-label">{rating.label}</span>
            </button>
          ))}
        </div>

        {selected ? (
          <>
            <p className="selected-rating" aria-live="polite">
              Selected: {selected.label}
            </p>
            <div className="submit-row">
              <button className="primary-button" disabled={status === "saving"} type="submit">
                {status === "saving" ? "Saving..." : "Submit Feedback"}
              </button>
            </div>
          </>
        ) : null}

        {status === "error" ? (
          <p className="hint" role="alert">
            Feedback was not saved. Please check the connection and try again.
          </p>
        ) : null}
      </form>
    </main>
  );
}
