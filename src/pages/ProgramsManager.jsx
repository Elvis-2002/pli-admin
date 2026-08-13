import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cloudinaryImage } from "../lib/cloudinary";
import PhotoPicker from "../components/PhotoPicker";
import { programs } from "../data/programs";

export default function ProgramsManager() {
  const [photos, setPhotos] = useState({});
  const [saving, setSaving] = useState(null); // slug currently saving

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "programPhotos"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data().photoPublicId || null;
      });
      setPhotos(map);
    });
    return unsub;
  }, []);

  async function setPhoto(slug, publicId) {
    setSaving(slug);
    try {
      await setDoc(doc(db, "programPhotos", slug), { photoPublicId: publicId });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <p className="font-eyebrow text-xs text-crimson">Programs</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        Program Photos
      </h1>
      <p className="mt-2 max-w-lg text-sm text-ink/60">
        Attach a photo to each program — shown on the Home, Programs, and
        individual program pages. Change it anytime; upload the photo
        first from the Gallery tab if it's not there yet.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {programs.map((p) => (
          <div
            key={p.slug}
            className="flex items-center gap-4 rounded-card border border-navy/10 bg-white p-4"
          >
            <div className="flex-1">
              <p className="font-display text-base font-semibold text-navy">
                {p.name}
              </p>
              <div className="mt-3">
                <PhotoPicker
                  value={photos[p.slug] || null}
                  onChange={(id) => setPhoto(p.slug, id)}
                />
              </div>
              {saving === p.slug && (
                <p className="mt-2 text-xs text-ink/40">Saving…</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
