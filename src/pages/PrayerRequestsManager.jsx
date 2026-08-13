import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function PrayerRequestsManager() {
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "prayerRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Failed to load prayer requests:", err);
        setRequests([]);
      }
    );
    return unsub;
  }, []);

  async function handleDelete(id) {
    if (!confirm("Remove this prayer request from the public site?")) return;
    await deleteDoc(doc(db, "prayerRequests", id));
  }

  return (
    <div>
      <p className="font-eyebrow text-xs text-crimson">Prayer Requests</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        Submitted Requests
      </h1>
      <p className="mt-2 max-w-lg text-sm text-ink/60">
        Anyone can submit a request directly from the public site — they
        appear here and on the public Prayer Requests page immediately.
        Remove anything inappropriate or spam.
      </p>

      <div className="mt-8">
        {requests === null ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-ink/50">No requests submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-4 rounded-card border border-navy/10 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink/80">{r.request}</p>
                  <p className="mt-2 font-eyebrow text-[11px] text-navy/50">
                    {r.name || "Anonymous"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="shrink-0 font-eyebrow text-[11px] text-crimson hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
