"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <section className="w-full max-w-[264px] sm:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Image
            src="/icons/hamburger.svg"
            width={36}
            height={36}
            alt="hamburger icon"
            className="cursor-pointer"
          />
        </SheetTrigger>

        {/* Sidebar drawer */}
        <SheetContent side="left" className="border-none bg-dark-1 p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
            <Image
              src="/icons/logo.svg"
              width={32}
              height={32}
              alt="SDP logo"
              className="max-sm:w-10 max-sm:h-10"
            />
            <p className="text-[26px] font-extrabold text-white">SDP</p>
          </Link>

          {/* Navigation Links */}
          <div className="flex h-[calc(100vh-72px)] flex-col justify-between overflow-y-auto">
            <section className="flex flex-col gap-6 pt-16 text-white">
              {sidebarLinks.map((link) => {
                const route = link.route.replace(/\/$/, ""); // normalize
                const isActive = pathname === route;

                return (
                  <SheetClose asChild key={link.route}>
                    <Link
                      href={link.route}
                      className={cn(
                        "flex gap-4 items-center p-4 rounded-lg w-full max-w-60",
                        isActive ? "bg-blue-1 text-[#0E78F9]" : "text-white"
                      )}
                    >
                      <Image
                        src={link.imgURL} // ✅ consistent with Sidebar
                        alt={link.label}
                        width={24}
                        height={24}
                      />
                      <p
                        className={cn(
                          "text-lg font-semibold max-lg:hidden",
                          isActive ? "text-white" : "text-white"
                        )}
                      >
                        {link.label}
                      </p>
                    </Link>
                  </SheetClose>
                );
              })}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;
