// This route group has been superseded by app/(protected).
// All /app/* URLs redirect to their new equivalents.
export default function OldAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
