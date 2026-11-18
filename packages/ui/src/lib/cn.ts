/**
 * Joins Tailwind class names, dropping empty values and resolving conflicts, so a caller's
 * class wins over a component's default:  cn('px-4 bg-primary', 'px-2')  →  'bg-primary px-2'
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
