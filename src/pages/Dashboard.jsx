import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Dashboard() {
  const [galleryCount, setGalleryCount] = useState(null);
  const [prayerCount, setPrayerCount] = useState(null);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "gallery"), (snap) => setGalleryCount(snap.size));
    const unsub2 = onSnapshot(collection(db, "prayerRequests"), (snap) => setPrayerCount(snap.size));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return (
    <div>
      <p className="font-eyebrow text-xs text-crimson">Dashboard</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        Welcome back
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/gallery"
          className="rounded-card border border-navy/10 bg-white p-6 transition-colors hover:border-crimson/40"
        >
          <p className="font-display text-3xl font-semibold text-navy">
            {galleryCount === null ? "—" : galleryCount}
          </p>
          <p className="mt-1 text-sm text-ink/60">Gallery items</p>
        </Link>
        <Link
          to="/prayer-requests"
          className="rounded-card border border-navy/10 bg-white p-6 transition-colors hover:border-crimson/40"
        >
          <p className="font-display text-3xl font-semibold text-navy">
            {prayerCount === null ? "—" : prayerCount}
          </p>
          <p className="mt-1 text-sm text-ink/60">Prayer requests</p>
        </Link>
        <Link
          to="/programs"
          className="rounded-card border border-navy/10 bg-white p-6 transition-colors hover:border-crimson/40"
        >
          <p className="font-display text-lg font-semibold text-navy">
            Programs
          </p>
          <p className="mt-1 text-sm text-ink/60">Photo for each program</p>
        </Link>
        <Link
          to="/team"
          className="rounded-card border border-navy/10 bg-white p-6 transition-colors hover:border-crimson/40"
        >
          <p className="font-display text-lg font-semibold text-navy">
            Team
          </p>
          <p className="mt-1 text-sm text-ink/60">Founders & members</p>
        </Link>
        <Link
          to="/stories"
          className="rounded-card border border-navy/10 bg-white p-6 transition-colors hover:border-crimson/40"
        >
          <p className="font-display text-lg font-semibold text-navy">
            Stories
          </p>
          <p className="mt-1 text-sm text-ink/60">Children & families we support</p>
        </Link>
        <Link
          to="/events"
          className="rounded-card border border-navy/10 bg-white p-6 transition-colors hover:border-crimson/40"
        >
          <p className="font-display text-lg font-semibold text-navy">
            Events
          </p>
          <p className="mt-1 text-sm text-ink/60">Upcoming events</p>
        </Link>
        <Link
          to="/settings"
          className="rounded-card border border-navy/10 bg-white p-6 transition-colors hover:border-crimson/40"
        >
          <p className="font-display text-lg font-semibold text-navy">
            Site Settings
          </p>
          <p className="mt-1 text-sm text-ink/60">Update contact details</p>
        </Link>
      </div>
    </div>
  );
}
