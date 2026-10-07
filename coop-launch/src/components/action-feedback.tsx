"use client";

import { useEffect, useState } from "react";

/** Green banner that appears after a successful save/action. */
export function ActionFeedback({
  message,
  flashKey,
}: {
  message: string | null;
  /** Change this value to re-show the banner */
  flashKey?: string | number | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(t);
  }, [message, flashKey]);

  if (!message || !visible) return null;

  return (
    <div
      role="status"
      className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 shadow-sm animate-in"
    >
      {message}
    </div>
  );
}
