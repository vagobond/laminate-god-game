// Minimal Backblaze B2 native API client for Deno edge functions.
// Docs: https://www.backblaze.com/b2/docs/

export interface B2Auth {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl: string;
  bucketId: string;
  bucketName: string;
}

export interface B2UploadTarget {
  uploadUrl: string;
  authorizationToken: string;
}

async function sha1(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function b2Authorize(
  keyId: string,
  applicationKey: string,
  bucketName: string,
): Promise<B2Auth> {
  const creds = btoa(`${keyId}:${applicationKey}`);
  const r = await fetch(
    "https://api.backblazeb2.com/b2api/v3/b2_authorize_account",
    { headers: { Authorization: `Basic ${creds}` } },
  );
  if (!r.ok) throw new Error(`B2 authorize failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const apiUrl: string = j.apiInfo.storageApi.apiUrl;
  const downloadUrl: string = j.apiInfo.storageApi.downloadUrl;
  const authorizationToken: string = j.authorizationToken;

  // Look up bucketId by name
  const lr = await fetch(`${apiUrl}/b2api/v3/b2_list_buckets`, {
    method: "POST",
    headers: { Authorization: authorizationToken, "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: j.accountId,
      bucketName,
    }),
  });
  if (!lr.ok) throw new Error(`B2 list_buckets failed: ${lr.status} ${await lr.text()}`);
  const lj = await lr.json();
  const bucket = lj.buckets?.[0];
  if (!bucket) throw new Error(`B2 bucket not found: ${bucketName}`);
  return {
    apiUrl,
    authorizationToken,
    downloadUrl,
    bucketId: bucket.bucketId,
    bucketName,
  };
}

export async function b2GetUploadUrl(auth: B2Auth): Promise<B2UploadTarget> {
  const r = await fetch(`${auth.apiUrl}/b2api/v3/b2_get_upload_url`, {
    method: "POST",
    headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
    body: JSON.stringify({ bucketId: auth.bucketId }),
  });
  if (!r.ok) throw new Error(`B2 get_upload_url failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return { uploadUrl: j.uploadUrl, authorizationToken: j.authorizationToken };
}

export async function b2UploadFile(
  target: B2UploadTarget,
  fileName: string,
  data: Uint8Array,
  contentType = "application/octet-stream",
): Promise<{ fileId: string; size: number }> {
  const checksum = await sha1(data);
  const r = await fetch(target.uploadUrl, {
    method: "POST",
    headers: {
      Authorization: target.authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(fileName),
      "Content-Type": contentType,
      "Content-Length": String(data.byteLength),
      "X-Bz-Content-Sha1": checksum,
    },
    body: data,
  });
  if (!r.ok) throw new Error(`B2 upload failed (${fileName}): ${r.status} ${await r.text()}`);
  const j = await r.json();
  return { fileId: j.fileId, size: j.contentLength };
}

/** Gzip a string using CompressionStream (available in Deno). */
export async function gzipString(s: string): Promise<Uint8Array> {
  const stream = new Blob([s]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Upload with retry. B2 returns transient 5xx / 503 / 408 (and 401 for an
 * expired upload URL) — the documented remedy is to fetch a fresh upload URL
 * and try again. Two consecutive nightlies (2026-08-14/15) failed on a single
 * B2 500 because there was no retry; this makes one flaky PUT no longer fail
 * the whole snapshot.
 */
export async function b2UploadWithRetry(
  auth: B2Auth,
  fileName: string,
  data: Uint8Array,
  contentType = "application/octet-stream",
  attempts = 4,
): Promise<{ fileId: string; size: number }> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const target = await b2GetUploadUrl(auth);
      return await b2UploadFile(target, fileName, data, contentType);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      // Retry on network errors, 5xx, 408, 429 and expired-upload-url 401.
      const retryable = /: (5\d\d|408|429|401) /.test(msg) || !/: \d{3} /.test(msg);
      if (!retryable || i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw lastErr;
}
