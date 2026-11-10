'use client';
/**
 * A panel that slides in from the right (full screen on phones), for long reference content
 * that shouldn't make the page itself long, e.g. the import page's list of columns.
 *
 *   <Drawer title="Import columns" description="What to write in each" trigger="See all columns">
 *     …anything…
 *   </Drawer>
 *
 * Built on the browser's <dialog>: Esc closes it, focus stays inside, the page behind is
 * dimmed; clicking the dimmed part closes it too. An <ActionForm> inside closes it when it
 * saves successfully (DrawerContext), so the result pop-up shows over the page.
 *
 * The panel is drawn at the end of the page (a portal), so a Drawer may sit inside another
 * form (e.g. "Add section" on the promotion board): its own form is never nested in the outer
 * one, and its "submit" doesn't reach the outer form.
 */
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { Button, type ButtonProps } from './button';

/** Closes the Drawer around (null outside a Drawer); <ActionForm> uses it after a success. */
export const DrawerContext = createContext<(() => void) | null>(null);

export interface DrawerProps {
  title: string;
  description?: ReactNode;
  /** The text (or content) of the button that opens it. */
  trigger: ReactNode;
  triggerVariant?: ButtonProps['variant'];
  triggerSize?: ButtonProps['size'];
  className?: string;
  children: ReactNode;
}

export function Drawer({
  title,
  description,
  trigger,
  triggerVariant = 'outline',
  triggerSize,
  className,
  children,
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useCallback(() => ref.current?.close(), []);
  // The portal needs the page (document.body), which only exists in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => ref.current?.showModal()}
      >
        {trigger}
      </Button>
      {mounted &&
        createPortal(
          <dialog
            ref={ref}
            aria-label={title}
            onClick={(e) => {
              if (e.target === e.currentTarget) ref.current?.close(); // the dimmed part
            }}
            className={cn(
              'ep-drawer fixed inset-y-0 right-0 m-0 ml-auto h-dvh max-h-none w-full max-w-full bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px] sm:max-w-lg sm:rounded-l-2xl',
              className,
            )}
          >
            {/* React passes events up through a portal: keep this panel's "submit" to itself. */}
            <div className="flex h-full flex-col" onSubmit={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  {description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => ref.current?.close()}
                  className="-mr-1 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <DrawerContext.Provider value={close}>{children}</DrawerContext.Provider>
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
