const DEFAULT_AVATAR_SVG = encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><rect width='64' height='64' rx='32' fill='#E5E7EB'/><circle cx='32' cy='24' r='12' fill='#9CA3AF'/><path d='M14 54c3.5-8.5 10.5-14 18-14s14.5 5.5 18 14' fill='#9CA3AF'/></svg>"
);

export const DEFAULT_AVATAR_SRC = `data:image/svg+xml;utf8,${DEFAULT_AVATAR_SVG}`;

export function getSafeAvatarSrc(value?: string | null) {
  if (!value) {
    return DEFAULT_AVATAR_SRC;
  }

  const normalized = value.trim();

  if (!normalized) {
    return DEFAULT_AVATAR_SRC;
  }

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  if (normalized.startsWith("/avatars/")) {
    return DEFAULT_AVATAR_SRC;
  }

  return normalized;
}
