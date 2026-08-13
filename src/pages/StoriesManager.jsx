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
import { cloudinaryImage } from "../lib/cloudinary";
import PhotoPicker from "../components/PhotoPicker";

const empty = {
  name: "",
  age: "",
  program: "",
  summary: "",
  photoPublicId: null,
  consentConfirmed: false,
  published: false,
};

export default function StoriesManager() {
  const [stories, setStories] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Failed to load stories:", err);
        setStories([]);
      }
    );
    return unsub;
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(story) {
    setEditingId(story.id);
    setForm({ ...empty, ...story });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.consentConfirmed) {
      alert("You must confirm guardian consent before this story can be saved.");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, age: form.age ? Math.round(Number(form.age)) : null };
      if (editingId) {
        await updateDoc(doc(db, "stories", editingId), data);
      } else {
        await addDoc(collection(db, "stories"), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this story from the site?")) return;
    await deleteDoc(doc(db, "stories", id));
    if (editingId === id) cancelEdit();
  }

  return (
    <div>
      <p className="font-eyebrow text-xs text-crimson">Stories</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        Children & Families We Support
      </h1>

      <div className="mt-3 max-w-lg rounded-card border border-gold/40 bg-gold/10 p-4 text-sm text-ink/75">
        <p className="font-eyebrow text-[11px] text-gold">
          Before publishing a child's story
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Get the parent or guardian's consent to share their photo and story publicly.</li>
          <li>Use a first name only — never a full name, school, or exact home address.</li>
          <li>
            Leave <strong>Published</strong> off until you're sure — unpublished
            stories are only visible here, not on the public site.
          </li>
        </ul>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-lg space-y-5 rounded-card border border-navy/10 bg-white p-6"
      >
        <p className="font-eyebrow text-xs text-navy/60">
          {editingId ? "Edit Story" : "Add a Story"}
        </p>

        <PhotoPicker
          value={form.photoPublicId}
          onChange={(id) => setForm((f) => ({ ...f, photoPublicId: id }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-eyebrow text-xs text-navy/60">First Name</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              placeholder="e.g. Grace"
              className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
            />
          </div>
          <div>
            <label className="font-eyebrow text-xs text-navy/60">Age (optional)</label>
            <input
              type="number"
              min="0"
              max="120"
              step="1"
              value={form.age}
              onChange={update("age")}
              className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
            />
          </div>
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">
            Related Program (optional)
          </label>
          <input
            value={form.program}
            onChange={update("program")}
            placeholder="e.g. Education Support & Scholarships"
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">Story</label>
          <textarea
            required
            rows={4}
            value={form.summary}
            onChange={update("summary")}
            placeholder="A short, respectful summary — avoid identifying details."
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={form.consentConfirmed}
            onChange={(e) =>
              setForm((f) => ({ ...f, consentConfirmed: e.target.checked }))
            }
            className="mt-1"
          />
          I confirm the parent/guardian has consented to sharing this
          photo and story publicly.
        </label>

        <label className="flex items-center gap-3 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) =>
              setForm((f) => ({ ...f, published: e.target.checked }))
            }
          />
          Published (visible on the public website)
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-navy px-5 py-2.5 font-eyebrow text-xs text-cream hover:bg-navy-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save Changes" : "Add Story"}
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
        {stories === null ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-ink/50">No stories added yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <div
                key={s.id}
                className="flex gap-4 rounded-card border border-navy/10 bg-white p-4"
              >
                {s.photoPublicId ? (
                  <img
                    src={cloudinaryImage(s.photoPublicId, { width: 120 })}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-sand-2 text-[10px] text-ink/40">
                    No photo
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-navy">
                    {s.name}
                    {s.age ? `, ${s.age}` : ""}
                  </p>
                  <p className="text-xs text-ink/60">
                    {s.published ? "Published" : "Draft — not visible on site"}
                  </p>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => startEdit(s)}
                      className="font-eyebrow text-[11px] text-navy/60 hover:text-crimson"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="font-eyebrow text-[11px] text-crimson hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
