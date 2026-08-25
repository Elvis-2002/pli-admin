import { useRef, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadToCloudinary, cloudinaryImage, deleteFromCloudinary } from "../lib/cloudinary";

const emptyForm = { title: "", details: "" };

export default function ChurchNeedsManager() {
  const [needs, setNeeds] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newForm, setNewForm] = useState(emptyForm);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "churchNeeds"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setNeeds(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Failed to load church needs:", err);
        setError("Could not load needs. Check your connection.");
        setNeeds([]);
      }
    );
    return unsub;
  }, []);

  function handlePickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  }

  async function handlePost() {
    if (!pendingFile) {
      setError("Choose a photo first.");
      return;
    }
    if (!newForm.title.trim()) {
      setError("Give this need a short title.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      const { publicId } = await uploadToCloudinary(pendingFile, setProgress);
      await addDoc(collection(db, "churchNeeds"), {
        publicId,
        title: newForm.title.trim(),
        details: newForm.details.trim(),
        createdAt: serverTimestamp(),
      });
      setNewForm(emptyForm);
      setPendingFile(null);
      setPendingPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err.message || "Could not post this need.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function startEdit(need) {
    setEditingId(need.id);
    setForm({ title: need.title || "", details: need.details || "" });
  }

  async function saveEdit(need) {
    try {
      await updateDoc(doc(db, "churchNeeds", need.id), {
        publicId: need.publicId,
        title: form.title.trim(),
        details: form.details.trim(),
        createdAt: need.createdAt,
      });
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Could not save changes.");
    }
  }

  async function handleDelete(need) {
    if (!confirm("Remove this need from the public site?")) return;
    try {
      await deleteFromCloudinary(need.publicId, "image");
    } catch (err) {
      console.error(err);
    }
    await deleteDoc(doc(db, "churchNeeds", need.id));
  }

  return (
    <div>
      <p className="font-eyebrow text-xs text-crimson">Church Needs</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        What the Church Needs
      </h1>
      <p className="mt-2 max-w-lg text-sm text-ink/60">
        Post a specific need — a photo, a short title, and a couple of
        sentences of detail. These appear publicly on the Prayer Requests
        page, above the community requests.
      </p>

      <div className="mt-8 max-w-lg space-y-4 rounded-card border border-navy/10 bg-white p-5">
        <p className="font-eyebrow text-xs text-navy/60">Post a New Need</p>

        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-dashed border-navy/20 bg-cream">
            {pendingPreview ? (
              <img src={pendingPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-ink/40">No photo</span>
            )}
          </div>
          <label className="cursor-pointer rounded-sm border border-navy/20 px-4 py-2 font-eyebrow text-[11px] text-navy hover:border-crimson">
            Choose Photo
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePickFile}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="font-eyebrow text-[11px] text-ink/50">Title</label>
          <input
            value={newForm.title}
            onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. New Sound System for Sunday Service"
            maxLength={120}
            className="mt-1 w-full rounded-sm border border-navy/20 px-3 py-2 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-[11px] text-ink/50">Details (optional)</label>
          <textarea
            value={newForm.details}
            onChange={(e) => setNewForm((f) => ({ ...f, details: e.target.value }))}
            rows={3}
            maxLength={500}
            placeholder="A couple of sentences on what's needed and why."
            className="mt-1 w-full rounded-sm border border-navy/20 px-3 py-2 text-sm outline-none focus:border-crimson"
          />
        </div>

        {error && <p className="text-sm text-crimson">{error}</p>}

        <button
          onClick={handlePost}
          disabled={uploading}
          className="rounded-sm bg-navy px-5 py-2.5 font-eyebrow text-xs text-cream hover:bg-navy-2 disabled:opacity-60"
        >
          {uploading ? `Posting… ${progress}%` : "Post This Need"}
        </button>
      </div>

      <div className="mt-10">
        {needs === null ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : needs.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing posted yet.</p>
        ) : (
          <div className="space-y-4">
            {needs.map((need) => (
              <div
                key={need.id}
                className="flex flex-col gap-4 rounded-card border border-navy/10 bg-white p-4 sm:flex-row"
              >
                <img
                  src={cloudinaryImage(need.publicId, { width: 320 })}
                  alt=""
                  className="aspect-[4/3] w-full shrink-0 rounded-sm object-cover sm:w-40"
                />
                <div className="min-w-0 flex-1">
                  {editingId === need.id ? (
                    <div className="space-y-3">
                      <input
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        maxLength={120}
                        className="w-full rounded-sm border border-navy/20 px-3 py-2 text-sm outline-none focus:border-crimson"
                      />
                      <textarea
                        value={form.details}
                        onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-sm border border-navy/20 px-3 py-2 text-sm outline-none focus:border-crimson"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(need)}
                          className="rounded-sm bg-navy px-4 py-2 font-eyebrow text-[11px] text-cream hover:bg-navy-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setForm(emptyForm);
                          }}
                          className="font-eyebrow text-[11px] text-ink/50 hover:text-navy"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-display text-base font-semibold text-navy">
                        {need.title}
                      </p>
                      {need.details && (
                        <p className="mt-1 text-sm text-ink/70">{need.details}</p>
                      )}
                      <div className="mt-3 flex gap-4">
                        <button
                          onClick={() => startEdit(need)}
                          className="font-eyebrow text-[11px] text-navy hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(need)}
                          className="font-eyebrow text-[11px] text-crimson hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
