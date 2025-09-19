'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HomeCardProps {
  className?: string;
  img: string;
  title: string;
  description: string;
  handleClick?: () => void;
}

const HomeCard = ({ className, img, title, description, handleClick }: HomeCardProps) => {
  return (
    <section
      className={cn(
        'bg-orange-1 px-4 py-4 flex items-center w-full xl:max-w-[270px] min-h-[100px] rounded-[14px] cursor-pointer gap-4',
        className
      )}
      onClick={handleClick}
    >
      {/* Logo Box */}
      <div className="flex items-center justify-center w-12 h-12 bg-dark-3 rounded-[10px] flex-shrink-0">
        <Image src={img} alt={title} width={27} height={27} />
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-base font-normal">{description}</p>
      </div>
    </section>
  );
};

export default HomeCard;
