'use client';
/**
 * Pop-up alerts in the middle of the screen, in the style of SweetAlert: an animated icon
 * (✓ success, ✕ error, ! warning, i info), a title, a message and buttons.
 *
 *   notify('Student admitted');                       // ✓, closes by itself after 2 seconds
 *   notify('The campus has students', 'error');       // ✕, stays until OK
 *   if (await confirmDialog({ text: 'Delete this role?', confirmText: 'Delete role', danger: true })) …
 *
 * <ActionForm> already uses them: every result pops up, and `confirmMessage` asks with
 * confirmDialog(). Pages rarely call them directly.
 *
 * After a redirect a server action can't open an alert: it leaves the message with flash()
 * (each app's lib/flash.ts), and <AlertHost> shows it on the next page. Put
 * <AlertHost flashCookie="..."> once in the app's root layout.
 *
 * One alert at a time; others wait their turn. Enter = the main button, Esc = cancel.
 * The animations are in styles.css (ep-alert-*).
 */
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

export type AlertIcon = 'success' | 'error' | 'warning' | 'info';

/** The kinds of result message (notify, flash). */
export type NotifyVariant = 'success' | 'error' | 'info';

export interface AlertOptions {
  icon: AlertIcon;
  title: string;
  text?: string;
  /** Close by itself after this many milliseconds (with a timer bar). */
  timer?: number;
  /** Shows a Cancel button: the alert is a question. */
  cancelText?: string;
  confirmText?: string;
  /** Red confirm button, for deleting and other changes that are hard to undo. */
  danger?: boolean;
}

interface QueuedAlert extends AlertOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

let open: (alert: QueuedAlert) => void = () => undefined;
let nextId = 1;

/** Shows an alert; resolves true for the main button, false for Cancel / Esc / backdrop. */
export function showAlert(options: AlertOptions): Promise<boolean> {
  return new Promise((resolve) => open({ ...options, id: nextId++, resolve }));
}

/** The result of an action: success closes by itself, an error waits for OK. */
export function notify(message: string, variant: NotifyVariant = 'success') {
  if (variant === 'success') return showAlert({ icon: 'success', title: message, timer: 2000 });
  if (variant === 'error') {
    return showAlert({ icon: 'error', title: 'Not done', text: message, confirmText: 'OK' });
  }
  return showAlert({ icon: 'info', title: message, confirmText: 'OK' });
}

/** "Are you sure?": resolves true when the user confirms. */
export function confirmDialog(options: {
  title?: string;
  text: string;
  confirmText?: string;
  danger?: boolean;
}): Promise<boolean> {
  return showAlert({
    icon: 'warning',
    title: options.title ?? 'Are you sure?',
    text: options.text,
    confirmText: options.confirmText ?? 'Yes',
    cancelText: 'Cancel',
    danger: options.danger,
  });
}

export function AlertHost({ flashCookie }: { flashCookie: string }) {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const pathname = usePathname();
  const current = queue[0];

  useEffect(() => {
    open = (alert) => setQueue((q) => [...q, alert]);
    return () => {
      open = () => undefined;
    };
  }, []);

  // A message left by a server action before a redirect: show it once, then delete it.
  useEffect(() => {
    const flash = takeFlash(flashCookie);
    if (flash) notify(flash.message, flash.variant);
  }, [pathname, flashCookie]);

  function close(confirmed: boolean) {
    if (!current) return;
    current.resolve(confirmed);
    setQueue((q) => q.slice(1));
  }

  return current ? <AlertBox key={current.id} alert={current} onClose={close} /> : null;
}

function AlertBox({
  alert,
  onClose,
}: {
  alert: QueuedAlert;
  onClose: (confirmed: boolean) => void;
}) {
  const question = alert.cancelText !== undefined;
  // The latest onClose, without restarting the timer when the parent re-renders.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current(false);
    };
    document.addEventListener('keydown', onKey);
    const timer = alert.timer ? setTimeout(() => closeRef.current(true), alert.timer) : undefined;
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [alert]);

  return (
    <div
      className="ep-alert-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`alert-${alert.id}-title`}
        aria-describedby={alert.text ? `alert-${alert.id}-text` : undefined}
        className="ep-alert-box relative w-full max-w-sm overflow-hidden rounded-2xl bg-card px-5 pb-5 pt-7 text-center text-card-foreground shadow-2xl sm:max-w-md sm:px-6 sm:pb-6 sm:pt-8"
      >
        <Icon icon={alert.icon} />
        <h2 id={`alert-${alert.id}-title`} className="mt-4 text-xl font-semibold">
          {alert.title}
        </h2>
        {alert.text && (
          <p
            id={`alert-${alert.id}-text`}
            className="mt-2 max-h-[50vh] overflow-y-auto whitespace-pre-line break-words text-sm text-muted-foreground"
          >
            {alert.text}
          </p>
        )}
        {(alert.confirmText || question) && (
          <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
            {question && (
              <Button variant="outline" onClick={() => onClose(false)}>
                {alert.cancelText}
              </Button>
            )}
            <Button
              autoFocus
              variant={alert.danger ? 'destructive' : 'default'}
              onClick={() => onClose(true)}
            >
              {alert.confirmText ?? 'OK'}
            </Button>
          </div>
        )}
        {alert.timer && (
          <div
            className="ep-alert-timer absolute inset-x-0 bottom-0 h-1 bg-success/60"
            style={{ animationDuration: `${alert.timer}ms` }}
          />
        )}
      </div>
    </div>
  );
}

const ICON_COLOUR: Record<AlertIcon, string> = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-primary',
};

/** The animated icon: the circle draws itself, then the mark. */
function Icon({ icon }: { icon: AlertIcon }) {
  return (
    <svg
      viewBox="0 0 56 56"
      aria-hidden="true"
      className={cn(
        'mx-auto size-20',
        ICON_COLOUR[icon],
        icon === 'error' && 'ep-alert-shake',
        icon === 'warning' && 'ep-alert-pulse',
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="28" cy="28" r="25" className="ep-alert-draw opacity-30" />
      <circle cx="28" cy="28" r="25" className="ep-alert-draw" />
      {icon === 'success' && <path d="M17 29l7 7 15-16" className="ep-alert-draw-late" />}
      {icon === 'error' && (
        <>
          <path d="M20 20l16 16" className="ep-alert-draw-late" />
          <path d="M36 20L20 36" className="ep-alert-draw-late" />
        </>
      )}
      {icon === 'warning' && (
        <>
          <path d="M28 16v15" className="ep-alert-draw-late" />
          <circle cx="28" cy="39" r="1.2" fill="currentColor" />
        </>
      )}
      {icon === 'info' && (
        <>
          <circle cx="28" cy="17" r="1.2" fill="currentColor" />
          <path d="M28 24v16" className="ep-alert-draw-late" />
        </>
      )}
    </svg>
  );
}

/** Reads the flash cookie (set by the server) and deletes it. */
function takeFlash(name: string): { message: string; variant: NotifyVariant } | null {
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
