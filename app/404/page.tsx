import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container mx-auto py-16 text-center">
      <h2 className="text-3xl font-bold mb-4">Story Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The story you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/">
          <BookOpen className="mr-2 h-4 w-4" />
          Browse Stories
        </Link>
      </Button>
    </div>
  );
}
