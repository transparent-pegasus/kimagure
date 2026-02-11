import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatStoreName = (text: string) => {
  if (!text) return text;

  return text.replace(/セブン-イレブン/g, "セブン").replace(/ファミリーマート/g, "ファミマ");
};
