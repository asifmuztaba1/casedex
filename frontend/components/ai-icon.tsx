import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AiIconProps = {
  className?: string;
};

export default function AiIcon({ className }: AiIconProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-sm",
        className
      )}
    >
      <Sparkles className="h-3 w-3 text-white" />
    </span>
  );
}
