import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  displayName: string;
  avatarColor: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
}

export function UserAvatar({
  displayName,
  avatarColor,
  avatarUrl,
  size = "md",
}: UserAvatarProps) {
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Avatar
      className={cn(size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm")}
    >
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback
        style={{ backgroundColor: avatarColor }}
        className="font-medium text-white"
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
