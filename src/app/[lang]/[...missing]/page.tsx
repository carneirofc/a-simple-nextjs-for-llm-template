import { notFound } from "next/navigation";

// Unmatched URLs under a locale render the localized `[lang]/not-found.tsx` inside the root layout.
export default function MissingPage() {
  notFound();
}
