/**
 * Optimizes a Supabase Storage image URL by appending render/resize parameters.
 * Falls back to the original URL for non-Supabase or falsy URLs.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options: { width?: number; height?: number; quality?: number } = {}
): string | undefined {
  if (!url) return undefined;

  const { width = 128, height, quality = 75 } = options;

  // Only transform Supabase storage URLs
  if (!url.includes("/storage/v1/object/public/")) return url;

  // Replace /object/public/ with /render/image/public/ and add params
  const renderUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  const params = new URLSearchParams();
  params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  params.set("resize", "cover");

  return `${renderUrl}?${params.toString()}`;
}
