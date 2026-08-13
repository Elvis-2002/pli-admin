// Cloudinary uploads via an unsigned upload preset.
//
// No API secret and no Firebase Cloud Function needed — the browser
// uploads directly to Cloudinary using just the Cloud Name and the
// preset name below. Anyone who discovers the preset name could upload
// to this account's folder, so keep the preset scoped (folder + file
// type/size limits) in the Cloudinary dashboard.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// 👇 Your unsigned upload preset name from the Cloudinary dashboard
// (Settings → Upload → Upload presets).
const UPLOAD_PRESET = "pli_admin";

/**
 * Upload a File to Cloudinary using an unsigned upload preset.
 * @param {File} file
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<{ publicId: string, url: string, resourceType: string }>}
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!CLOUD_NAME) {
    throw new Error("Cloudinary is not configured — set VITE_CLOUDINARY_CLOUD_NAME.");
  }

  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        resolve({ publicId: res.public_id, url: res.secure_url, resourceType });
      } else {
        reject(new Error("Cloudinary upload failed: " + xhr.responseText));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

export function cloudinaryImage(publicId, { width = 640, quality = "auto", format = "auto" } = {}) {
  if (!CLOUD_NAME || !publicId) return null;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_${format},q_${quality},w_${width}/${publicId}`;
}

// Unsigned uploads have no matching unsigned "delete" — Cloudinary
// requires a signed request to remove an asset. Without a Cloud
// Function, we can't do that from the browser, so this just logs and
// lets the caller carry on (GalleryManager already removes the
// Firestore record regardless, so the item disappears from the site —
// the file itself is just left behind in Cloudinary storage).
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  console.warn(
    "Skipping Cloudinary deletion (unsigned uploads can't delete). " +
      "Remove manually in the Cloudinary dashboard if needed:",
    publicId,
    resourceType
  );
}
