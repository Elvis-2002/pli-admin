import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const SETTINGS_DOC = doc(db, "settings", "site");

export default function Settings() {
  const [form, setForm] = useState({ phone: "", email: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoc(SETTINGS_DOC)
      .then((snap) => {
        if (snap.exists()) setForm((f) => ({ ...f, ...snap.data() }));
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  function update(field) {
    return (e) => {
      setSaved(false);
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await setDoc(SETTINGS_DOC, { ...form, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
    } catch (err) {
      setError("Could not save changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-lg">
      <p className="font-eyebrow text-xs text-crimson">Settings</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
        Site Contact Details
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        These values are read by the public website's Contact page.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="font-eyebrow text-xs text-navy/60">Phone</label>
          <input
            value={form.phone}
            onChange={update("phone")}
            placeholder="+256 7XX XXX XXX"
            className="mt-2 w-full rounded-sm border border-navy/20 bg-white px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="info@promisedlandinitiative.org"
            className="mt-2 w-full rounded-sm border border-navy/20 bg-white px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div>
          <label className="font-eyebrow text-xs text-navy/60">Location</label>
          <input
            value={form.location}
            onChange={update("location")}
            placeholder="Uganda"
            className="mt-2 w-full rounded-sm border border-navy/20 bg-white px-4 py-3 text-sm outline-none focus:border-crimson"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-navy px-6 py-3 font-eyebrow text-xs text-cream hover:bg-navy-2 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved && <span className="ml-3 text-xs text-ink/50">Saved.</span>}
        {error && <p className="mt-3 text-sm text-crimson">{error}</p>}
      </form>
    </div>
  );
}
