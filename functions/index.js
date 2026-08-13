const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const crypto = require("crypto");

// Set with: firebase functions:secrets:set CLOUDINARY_API_SECRET
const CLOUDINARY_API_SECRET = defineSecret("CLOUDINARY_API_SECRET");
// Not secret, but kept as config so it's not hardcoded in source.
const CLOUDINARY_API_KEY = defineString("CLOUDINARY_API_KEY");
const CLOUDINARY_CLOUD_NAME = defineString("CLOUDINARY_CLOUD_NAME");

/**
 * Callable function used by the admin app before every Cloudinary upload.
 * Requires the caller to be authenticated (checked via context.auth) so
 * only signed-in admins can obtain a valid signature — the Cloudinary
 * API secret itself never leaves this server environment.
 */
exports.getCloudinaryUploadSignature = onCall(
  { secrets: [CLOUDINARY_API_SECRET] },
  (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to upload."
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = request.data?.folder || "promised-land-initiative/gallery";

    // Cloudinary signs the exact string of params (alphabetical, excluding
    // file/api_key/signature) + the API secret.
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + CLOUDINARY_API_SECRET.value())
      .digest("hex");

    return { signature, timestamp, folder };
  }
);

/**
 * Callable function that deletes a Cloudinary asset. Requires auth for
 * the same reason as above — only signed-in admins can remove media.
 */
exports.deleteCloudinaryAsset = onCall(
  { secrets: [CLOUDINARY_API_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { publicId, resourceType = "image" } = request.data || {};
    if (!publicId) {
      throw new HttpsError("invalid-argument", "publicId is required.");
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + CLOUDINARY_API_SECRET.value())
      .digest("hex");

    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: CLOUDINARY_API_KEY.value(),
      signature,
    });

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME.value()}/${resourceType}/destroy`,
      { method: "POST", body }
    );
    const data = await res.json();

    if (data.result !== "ok" && data.result !== "not found") {
      throw new HttpsError("internal", "Cloudinary deletion failed: " + JSON.stringify(data));
    }

    return { result: data.result };
  }
);
