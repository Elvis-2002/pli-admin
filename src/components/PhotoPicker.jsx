import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cloudinaryImage } from "../lib/cloudinary";

/**
 * A small picker modal that lists images already uploaded to the Gallery
 * (see GalleryManager) so they can be reused for other slots — team
 * member photos, story photos — without uploading the same file twice.
 *
 * Upload new photos from the Gallery tab first; they'll show up here.
 */
export default function PhotoPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!open) return;
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((i) => i.resourceType !== "video")
      );
    });
    return unsub;
  }, [open]);

  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={cloudinaryImage(value, { width: 120 })}
            alt=""
            className="h-16 w-16 rounded-sm object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-navy/20 text-[10px] text-ink/40">
            No photo
          </div>
        )}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-eyebrow text-[11px] text-navy hover:text-crimson"
          >
            {value ? "Change photo" : "Choose photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="font-eyebrow text-[11px] text-ink/40 hover:text-crimson"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-card bg-cream p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-eyebrow text-xs text-navy/60">
                Choose from Gallery
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-eyebrow text-[11px] text-ink/50 hover:text-crimson"
              >
                Close
              </button>
            </div>

            {items === null ? (
              <p className="mt-6 text-sm text-ink/50">Loading…</p>
            ) : items.length === 0 ? (
              <p className="mt-6 text-sm text-ink/50">
                No photos uploaded yet — upload one from the Gallery tab
                first.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.publicId);
                      setOpen(false);
                    }}
                    className="overflow-hidden rounded-sm border border-transparent hover:border-crimson"
                  >
                    <img
                      src={cloudinaryImage(item.publicId, { width: 200 })}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
