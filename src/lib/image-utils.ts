/**
 * Returns a displayable URL for a stored image.
 *
 * NOTE (2026-08-13): this used to rewrite /object/public/ URLs to the
 * /render/image/ transformation endpoint. Image transformations are a
 * paid-plan Supabase feature; on the independent project the render
 * endpoint returns 403 FeatureNotEnabled, which blanked every avatar and
 * group icon once the old (Lovable-era) project domain went dead. Serve
 * the original object URL instead. If transformations are ever enabled
 * on the project, the rewrite can be restored — options are kept in the
 * signature so call sites don't need to change.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  _options: { width?: number; height?: number; quality?: number } = {}
): string | undefined {
  if (!url) return undefined;
  return url;
}
