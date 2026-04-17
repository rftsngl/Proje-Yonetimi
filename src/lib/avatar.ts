/**
 * Resolve avatar display URL.
 *
 * If the avatar value starts with '/uploads/', it's an uploaded file.
 * Otherwise, use the picsum seed-based approach for legacy users.
 */
export const resolveAvatarUrl = (avatar: string, size = 120) => {
  if (avatar.startsWith('/uploads/')) {
    return avatar;
  }
  return `https://picsum.photos/seed/${avatar}/${size}/${size}`;
};
