import Image from "next/image";

interface AvatarChipProps {
  name: string;
  avatarUrl?: string | null;
}

export function AvatarChip({ name, avatarUrl }: AvatarChipProps) {
  const fallbackAvatar =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/60 px-3 py-2 dark:bg-white/5">
      <div className="text-right">
        <p className="max-w-[120px] truncate text-sm font-medium">{name}</p>
      </div>
      <Image
        src={avatarUrl || fallbackAvatar}
        alt="Profile"
        width={40}
        height={40}
        className="rounded-2xl object-cover"
        unoptimized={Boolean(avatarUrl)}
      />
    </div>
  );
}
