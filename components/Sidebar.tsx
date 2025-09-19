"use client";

import { sidebarLinks } from '@/constants';
import { usePathname } from 'next/navigation';
import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const Sidebar = () => {
  const pathname = usePathname().replace(/\/$/, ""); // remove trailing slash

  return (
    <section className="sticky left-0 top-0 flex h-screen w-fit flex-col justify-between bg-dark-1 p-6 pt-28 text-white max-sm:hidden lg:w-[264px]">
      <div className="flex flex-1 flex-col gap-6">
        {sidebarLinks.map((link) => {
          const route = link.route.replace(/\/$/, ""); // normalize
          const isActive = pathname === route;
          //const isActive=pathname===link.route || pathname.startsWith(`${link.route}/`);
          return (
            <a
              key={link.route}
              href={link.route}
              className={cn(
                'flex gap-4 items-center p-4 rounded-lg justify-start',
                isActive ? 'bg-blue-1 text-[#0E78F9]' : 'text-white'
              )}
            >
              <Image
                src={link.imgURL}
                alt={link.label}
                width={24}
                height={24}
              />
              <p className={cn(
                "text-lg font-semibold max-lg:hidden",
                isActive ? "text-white" : "text-white"
              )}>
                {link.label}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default Sidebar;