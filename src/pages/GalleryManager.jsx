import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadToCloudinary, cloudinaryImage, deleteFromCloudinary } from "../lib/cloudinary";

export default function GalleryManager() {
  const [items, setItems] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Failed to load gallery:", err);
        setError("Could not load the gallery. Check your connection.");
        setItems([]);
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
      const { publicId, resourceType } = await uploadToCloudinary(file, setProgress);
      await addDoc(collection(db, "gallery"), {
        publicId,
        resourceType,
        caption: "",
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

  async function handleDelete(item) {
    if (!confirm("Remove this item from the gallery? This cannot be undone.")) return;
    try {
      await deleteFromCloudinary(item.publicId, item.resourceType);
    } catch (err) {
      // Even if Cloudinary deletion fails (e.g. already removed), still
      // remove the Firestore record so it stops showing on the site.
      console.error(err);
    }
    await deleteDoc(doc(db, "gallery", item.id));
  }

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-eyebrow text-xs text-crimson">Gallery</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
            Photos & Video
          </h1>
        </div>
        <label className="cursor-pointer rounded-sm bg-navy px-5 py-2.5 font-eyebrow text-xs text-cream hover:bg-navy-2">
          {uploading ? `Uploading… ${progress}%` : "Upload New"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-crimson">{error}</p>}

      {items === null ? (
        <p className="mt-10 text-sm text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-navy/20 px-8 py-16 text-center">
          <p className="text-sm text-ink/60">
            No media yet. Upload the first photo or video above.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-card border border-navy/10 bg-white">
              {item.resourceType === "video" ? (
                <div className="flex aspect-[4/3] items-center justify-center bg-navy/5 text-xs text-ink/50">
                  Video · {item.publicId.split("/").pop()}
                </div>
              ) : (
                <img
                  src={cloudinaryImage(item.publicId, { width: 400 })}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="flex items-center justify-between p-3">
                <span className="text-xs text-ink/40">
                  {item.resourceType}
                </span>
                <button
                  onClick={() => handleDelete(item)}
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
  );
}
