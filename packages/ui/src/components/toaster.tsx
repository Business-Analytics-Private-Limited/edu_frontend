'use client';
/**
 * Pop-up messages ("toasts") in the corner of the screen: "Saved", "Campus closed", errors.
 * They disappear by themselves (errors stay longer) or with ×.
 *
 *   toast('Student admitted');                    // from any client component
 *   toast('Could not save', 'error');
 *
 * <ActionForm> shows a toast for every success and error by itself; nothing to do in pages.
 *
 * After a redirect (e.g. "create" opens the new record) a server action can't call toast():
 * it sets the flash cookie instead (lib/flash.ts in each app), and <Toaster> shows that message
 * on the next page. Put <Toaster flashCookie="..."> once in the app's root layout.
 */
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '../lib/cn';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const listeners = new Set<(item: ToastItem) => void>();
let nextId = 1;

/** Shows a message in the corner of the screen. */
export function toast(message: string, variant: ToastVariant = 'success') {
  const item = { id: nextId++, message, variant };
  listeners.forEach((listener) => listener(item));
}

const styles: Record<ToastVariant, string> = {
  success: 'border-success/40 bg-background text-foreground [&_.dot]:bg-success',
  error: 'border-destructive/40 bg-background text-foreground [&_.dot]:bg-destructive',
  info: 'border-border bg-background text-foreground [&_.dot]:bg-primary',
};

/** How long a message stays: errors longer, so there is time to read them. */
const DURATION: Record<ToastVariant, number> = { success: 4000, info: 5000, error: 8000 };

export function Toaster({ flashCookie }: { flashCookie: string }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const pathname = usePathname();

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((i) => i.id !== id));
  }, []);

  useEffect(() => {
    const show = (item: ToastItem) => {
      setItems((current) => [...current.slice(-3), item]); // at most 4 at a time
      setTimeout(() => dismiss(item.id), DURATION[item.variant]);
    };
    listeners.add(show);
    return () => {
      listeners.delete(show);
    };
  }, [dismiss]);

  // A message left by a server action before a redirect: show it once, then delete it.
  useEffect(() => {
    const flash = takeFlash(flashCookie);
    if (flash) toast(flash.message, flash.variant);
  }, [pathname, flashCookie]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.variant === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg',
            styles[item.variant],
          )}
        >
          <span className="dot mt-1.5 size-2 shrink-0 rounded-full" aria-hidden="true" />
          <p className="flex-1">{item.message}</p>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="-mr-1 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/** Reads the flash cookie (set by the server) and deletes it. */
function takeFlash(name: string): { message: string; variant: ToastVariant } | null {
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  if (!entry) return null;
  document.cookie = `${name}=; Max-Age=0; path=/`;
  try {
    const value = JSON.parse(decodeURIComponent(entry.slice(name.length + 1)));
    return typeof value.message === 'string' ? value : null;
  } catch {
    return null;
  }
}
