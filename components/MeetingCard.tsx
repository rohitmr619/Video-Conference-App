'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  isRecordings?: boolean;
  onDelete?: () => void;
}

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  isRecordings,
  onDelete,
}: MeetingCardProps) => {
  const { toast } = useToast();

  return (
    <section className="flex min-h-[200px] w-full flex-col justify-between rounded-[14px] bg-dark-1 px-5 py-6 xl:max-w-[568px]">
      {/* Top Section */}
      <article className="flex flex-col gap-4">
        <Image src={icon} alt="meeting-type" width={28} height={28} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-base font-normal">{date}</p>
        </div>
      </article>

      {/* Buttons Section */}
      <article className="flex flex-wrap gap-2 mt-4">
        {!isPreviousMeeting && (
          <Button
            onClick={handleClick}
            className="flex items-center gap-1 rounded px-3 py-1 text-sm bg-blue-1"
          >
            {buttonIcon1 && (
              <Image src={buttonIcon1} alt="feature" width={16} height={16} />
            )}
            {buttonText}
          </Button>
        )}

        <Button
          onClick={() => {
            navigator.clipboard.writeText(link);
            toast({ title: 'Link Copied' });
          }}
          className="flex items-center gap-1 rounded px-3 py-1 text-sm bg-dark-4"
        >
          <Image src="/icons/copy.svg" alt="copy" width={16} height={16} />
          Copy Link
        </Button>

        {isRecordings && onDelete && (
          <Button
            onClick={onDelete}
            className="flex items-center gap-1 rounded px-3 py-1 text-sm bg-red-500 hover:bg-red-600"
          >
            <Image src="/icons/delete.svg" alt="delete" width={16} height={16} />
            Delete
          </Button>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
