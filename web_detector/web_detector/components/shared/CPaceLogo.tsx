import Image from 'next/image';

export function CPaceLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-md bg-white ${compact ? 'h-10 w-52' : 'h-12 w-64'}`}
    >
      <Image
        src="/cpace-logo.png"
        alt="CPACE Continuing Education"
        width={1600}
        height={1600}
        priority
        className="h-full w-full object-cover object-center"
      />
    </div>
  );
}
