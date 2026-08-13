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

const empty = { name: "", role: "", bio: "", photoPublicId: null, isVisionBearer: false };

export default function TeamManager() {
  const [members, setMembers] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "team"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Failed to load team:", err);
        setMembers([]);
      }
    );
    return unsub;
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function startEdit(member) {
    setEditingId(member.id);
    setForm({
      name: member.name || "",
      role: member.role || "",
      bio: member.bio || "",
      photoPublicId: member.photoPublicId || null,
      isVisionBearer: member.isVisionBearer || false,
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
        await updateDoc(doc(db, "team", editingId), { ...form });
      } else {
        await addDoc(collection(db, "team"), {
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
    if (!confirm("Remove this team member from the site?")) return;
    await deleteDoc(doc(db, "team", id));
    if (editingId === id) cancelEdit();
  }

  return (
    <div>
      <p className="font-eyebrow text-xs text-crimson">Team</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        Founders & Members
      </h1>
      <p className="mt-2 max-w-lg text-sm text-ink/60">
        Shown on the public site's About page. Upload the photo first from
        the Gallery tab, then attach it here.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-lg space-y-5 rounded-card border border-navy/10 bg-white p-6"
      >
        <p className="font-eyebrow text-xs text-navy/60">
          {editingId ? "Edit Member" : "Add a Member"}
        </p>

        <PhotoPicker
          value={form.photoPublicId}
          onChange={(id) => setForm((f) => ({ ...f, photoPublicId: id }))}
        />

        <div>
          <label className="font-eyebrow text-xs text-navy/60">Name</label>
          <input
            required
            value={form.name}
            onChange={update("name")}
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">Role</label>
          <input
            required
            value={form.role}
            onChange={update("role")}
            placeholder="Founder & Executive Director"
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">
            Short Bio (optional)
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={update("bio")}
            className="mt-2 w-full rounded-sm border border-navy/20 bg-cream px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={form.isVisionBearer}
            onChange={(e) =>
              setForm((f) => ({ ...f, isVisionBearer: e.target.checked }))
            }
            className="mt-1"
          />
          Show as the Vision Bearer spotlight on the About page (use for
          the founder — only one member should have this checked).
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-navy px-5 py-2.5 font-eyebrow text-xs text-cream hover:bg-navy-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save Changes" : "Add Member"}
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
        {members === null ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-ink/50">No team members added yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex gap-4 rounded-card border border-navy/10 bg-white p-4"
              >
                {m.photoPublicId ? (
                  <img
                    src={cloudinaryImage(m.photoPublicId, { width: 120 })}
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
                    {m.name}
                    {m.isVisionBearer && (
                      <span className="ml-2 font-eyebrow text-[10px] text-crimson">
                        VISION BEARER
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/60">{m.role}</p>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => startEdit(m)}
                      className="font-eyebrow text-[11px] text-navy/60 hover:text-crimson"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
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
