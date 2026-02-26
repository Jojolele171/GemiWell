import { cn } from "@/lib/utils";
import Image from "next/image";

export const LogoIcon = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("relative overflow-hidden rounded-full shrink-0 shadow-sm bg-transparent size-10", className)} {...props}>
    <Image
      src="/icon.png"
      alt="GemiWell Logo"
      fill
      className="object-contain p-1"
      priority
    />
  </div>
);
