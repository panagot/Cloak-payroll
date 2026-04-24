/**
 * Shown while route segments load (Next.js `loading.js` convention).
 */
export default function AppLoading() {
  return (
    <div
      className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 px-4 py-24"
      role="status"
      aria-label="Loading"
    >
      <div
        className="h-9 w-9 motion-safe:animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
        aria-hidden
      />
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  );
}
