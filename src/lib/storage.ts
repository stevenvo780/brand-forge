import { Storage } from "@google-cloud/storage";

const BUCKET = process.env.ASSETS_BUCKET || "brand-forge-assets";

// Default ADC credentials. On Cloud Run these come from the compute service
// account which has objectAdmin on the bucket.
let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage();
  }
  return storage;
}

export async function uploadAsset(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(key);
  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  return `https://storage.googleapis.com/${BUCKET}/${key}`;
}
