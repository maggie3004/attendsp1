import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export default function Avatar({ name, image, size = "md", className }: AvatarProps) {
  const initials = getInitials(name);
  
  // Generate a consistent color based on the name
  const colors = [
    "bg-primary text-white",
    "bg-success-500 text-white",
    "bg-warning-500 text-white",
    "bg-info-500 text-white",
    "bg-purple-500 text-white",
    "bg-pink-500 text-white",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const colorClass = colors[colorIndex];

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-white shrink-0",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold ring-2 ring-white shrink-0",
        sizeClasses[size],
        colorClass,
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
