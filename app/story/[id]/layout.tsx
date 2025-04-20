import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutual Story",
  description: "Learn languages through bilingual stories",
};

export default function FullScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="relative w-full h-full pt-16">{children}</div>
    </div>
  );
}
