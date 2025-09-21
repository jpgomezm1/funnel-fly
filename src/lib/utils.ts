import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mapeo de comerciales para mostrar nombres legibles
export const COMERCIALES_NAMES = {
  'juan_pablo_gomez': 'Juan Pablo Gomez',
  'agustin_hoyos': 'Agustin Hoyos',
  'sara_garces': 'Sara Garces',
  'pamela_puello': 'Pamela Puello'
} as const;

export function formatOwnerName(ownerId?: string | null): string {
  if (!ownerId) return 'Sin asignar';
  return COMERCIALES_NAMES[ownerId as keyof typeof COMERCIALES_NAMES] || ownerId;
}
