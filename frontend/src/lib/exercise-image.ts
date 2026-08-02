/** Exercise images are stored as paths relative to the backend's static mount. */
export function exerciseImageUrl(path: string): string {
  return `/static/exercise-images/${path}`;
}
