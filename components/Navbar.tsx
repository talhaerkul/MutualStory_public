"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isAdmin = user?.email === "talhadoga@hotmail.com";

  const navItems = [
    { href: "/", label: "Home" },
    ...(user ? [{ href: "/favorites", label: "Favorites" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel" }] : []),
  ];

  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 hover:to-primary transition-all duration-300"
            >
              <img
                src="/brand.png"
                alt="Brand logo"
                className="h-16 w-auto p-3"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3 py-2 rounded-md text-gray-700 hover:text-primary transition-colors duration-200 group"
              >
                {pathname === item.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-md z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
              </Link>
            ))}

            {user ? (
              <div className="relative ml-2 group">
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="border-gray-200 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-600 to-gray-500">
                    Logout
                  </span>
                </Button>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
              </div>
            ) : (
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-primary to-primary/90 hover:to-primary transition-all duration-200 shadow-md hover:shadow-lg">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
