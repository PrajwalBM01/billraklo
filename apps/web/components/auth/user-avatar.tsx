import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?"
  );
}

export function UserAvatar({
  user,
  size,
}: {
  user: { name: string; image?: string | null };
  size?: React.ComponentProps<typeof Avatar>["size"];
}) {
  return (
    <Avatar size={size}>
      {user.image && <AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
