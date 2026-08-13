import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const empty = { title: "", date: "", location: "", description: "" };

export default function EventsManager() {
  const [events, setEvents] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Failed to load events:", err);
        setEvents([]);
      }
    );
    return unsub;
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(event) {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      date: event.date || "",
      location: event.location || "",
      description: event.description || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "events", editingId), { ...form });
      } else {
        await addDoc(collection(db, "events"), {
          ...form,
          createdAt: serverTimestamp(),
        });
      }
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this event?")) return;
    await deleteDoc(doc(db, "events", id));
    if (editingId === id) cancelEdit();
  }

  return (
    <div>
      <p className="font-eyebrow text-xs text-crimson">Events</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        Upcoming Events
      </h1>
      <p className="mt-2 max-w-lg text-sm text-ink/60">
        Shown on the public site's Events page. Past events drop off the
        public page automatically — no need to delete them here unless
        you want to.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-lg space-y-5 rounded-card border border-navy/10 bg-white p-6"
      >
        <p className="font-eyebrow text-xs text-navy/60">
          {editingId ? "Edit Event" : "Add an Event"}
        </p>

        <div>
          <label className="font-eyebrow text-xs text-navy/60">Title</label>
          <input
            required
            value={form.title}
            onChange={update("title")}
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={update("date")}
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">
            Location (optional)
          </label>
          <input
            value={form.location}
            onChange={update("location")}
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">
            Description (optional)
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={update("description")}
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-navy px-5 py-2.5 font-eyebrow text-xs text-cream hover:bg-navy-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save Changes" : "Add Event"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="font-eyebrow text-xs text-ink/50 hover:text-crimson"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-10">
        {events === null ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-ink/50">No events added yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-4 rounded-card border border-navy/10 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-navy">
                    {e.title}
                  </p>
                  <p className="text-xs text-ink/60">
                    {e.date} {e.location ? `· ${e.location}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() => startEdit(e)}
                    className="font-eyebrow text-[11px] text-navy/60 hover:text-crimson"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="font-eyebrow text-[11px] text-crimson hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
