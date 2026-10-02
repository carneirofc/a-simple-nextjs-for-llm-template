import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 p-8">
      <h1 className="font-semibold text-2xl">Page not found</h1>
      <Button asChild={true} variant="ghost">
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
