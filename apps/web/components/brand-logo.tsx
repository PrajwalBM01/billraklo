import Image from "next/image";
import logo from "@/public/billraklo-logo.svg";

/** Decorative next to the visible Billraklo wordmark. */
export function BrandLogo({ className }: { className?: string }) {
  return <Image src={logo} alt="" width={40} height={40} unoptimized className={className} />;
}
