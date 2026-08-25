import { useEffect, useRef, useState } from "react";
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

const emptyForm = { heading: "", subtext: "" };

export default function HeroSlidesManager() {
  const [slides, setSlides] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "heroSlides"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => setSlides(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("Failed to load hero slides:", err);
        setError("Could not load slides. Check your connection.");
        setSlides([]);
      }
    );
    return unsub;
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    setProgress(0);
    try {
      const { publicId } = await uploadToCloudinary(file, setProgress);
      const nextOrder = slides && slides.length ? Math.max(...slides.map((s) => s.order ?? 0)) + 1 : 0;
      await addDoc(collection(db, "heroSlides"), {
        publicId,
        heading: "",
        subtext: "",
        order: nextOrder,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function startEdit(slide) {
    setEditingId(slide.id);
    setForm({ heading: slide.heading || "", subtext: slide.subtext || "" });
  }

  async function saveEdit(slide) {
    try {
      await updateDoc(doc(db, "heroSlides", slide.id), {
        publicId: slide.publicId,
        heading: form.heading.trim(),
        subtext: form.subtext.trim(),
        order: slide.order ?? 0,
        createdAt: slide.createdAt,
      });
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Could not save changes.");
    }
  }

  async function handleDelete(slide) {
    if (!confirm("Remove this slide from the homepage? This cannot be undone.")) return;
    try {
      await deleteFromCloudinary(slide.publicId, "image");
    } catch (err) {
      console.error(err);
    }
    await deleteDoc(doc(db, "heroSlides", slide.id));
  }

  async function move(slide, direction) {
    if (!slides) return;
    const sorted = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((s) => s.id === slide.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];

    await updateDoc(doc(db, "heroSlides", slide.id), { order: other.order ?? 0 });
    await updateDoc(doc(db, "heroSlides", other.id), { order: slide.order ?? 0 });
  }

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-eyebrow text-xs text-crimson">Hero Slides</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
            Homepage Carousel
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            These images and words rotate at the top of the homepage. Add a
            photo, then give it a heading and short line of text.
          </p>
        </div>
        <label className="cursor-pointer rounded-sm bg-navy px-5 py-2.5 font-eyebrow text-xs text-cream hover:bg-navy-2">
          {uploading ? `Uploading… ${progress}%` : "Add Slide"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-crimson">{error}</p>}

      {slides === null ? (
        <p className="mt-10 text-sm text-ink/50">Loading…</p>
      ) : slides.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-navy/20 px-8 py-16 text-center">
          <p className="text-sm text-ink/60">
            No slides yet. Add the first photo above — the homepage shows a
            fixed fallback until at least one slide exists.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {[...slides]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((slide, i, arr) => (
              <div
                key={slide.id}
                className="flex flex-col gap-4 rounded-card border border-navy/10 bg-white p-4 sm:flex-row"
              >
                <img
                  src={cloudinaryImage(slide.publicId, { width: 320 })}
                  alt=""
                  className="aspect-[4/3] w-full shrink-0 rounded-sm object-cover sm:w-40"
                />

                <div className="min-w-0 flex-1">
                  {editingId === slide.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="font-eyebrow text-[11px] text-ink/50">
                          Heading
                        </label>
                        <input
                          value={form.heading}
                          onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
                          placeholder="e.g. Our Vision is to Reveal the Glory of Christ"
                          className="mt-1 w-full rounded-sm border border-navy/20 px-3 py-2 text-sm outline-none focus:border-crimson"
                        />
                      </div>
                      <div>
                        <label className="font-eyebrow text-[11px] text-ink/50">
                          Subtext (optional)
                        </label>
                        <input
                          value={form.subtext}
                          onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))}
                          placeholder="A short supporting line"
                          className="mt-1 w-full rounded-sm border border-navy/20 px-3 py-2 text-sm outline-none focus:border-crimson"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(slide)}
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
                        {slide.heading || (
                          <span className="text-ink/40">No heading yet</span>
                        )}
                      </p>
                      {slide.subtext && (
                        <p className="mt-1 text-sm text-ink/70">{slide.subtext}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <button
                          onClick={() => startEdit(slide)}
                          className="font-eyebrow text-[11px] text-navy hover:underline"
                        >
                          Edit Text
                        </button>
                        <button
                          onClick={() => move(slide, "up")}
                          disabled={i === 0}
                          className="font-eyebrow text-[11px] text-ink/50 hover:text-navy disabled:opacity-30"
                        >
                          Move Up
                        </button>
                        <button
                          onClick={() => move(slide, "down")}
                          disabled={i === arr.length - 1}
                          className="font-eyebrow text-[11px] text-ink/50 hover:text-navy disabled:opacity-30"
                        >
                          Move Down
                        </button>
                        <button
                          onClick={() => handleDelete(slide)}
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
  );
}
