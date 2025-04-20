"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Image, Plus, Quote, Shield } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: Shield,
    },
    {
      href: "/admin/stories",
      label: "Stories",
      icon: BookOpen,
    },
    {
      href: "/admin/stories/create",
      label: "Add Story",
      icon: Plus,
    },
    {
      href: "/admin/banners",
      label: "Banners",
      icon: Image,
    },
    {
      href: "/admin/quotes",
      label: "Quotes",
      icon: Quote,
    },
  ];

  return (
    <div className="w-64 bg-white border-r min-h-screen p-4">
      <h1 className="text-xl font-bold mb-8">Admin Panel</h1>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                pathname === link.href
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
