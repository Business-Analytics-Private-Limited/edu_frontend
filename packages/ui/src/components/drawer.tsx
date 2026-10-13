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
 * dimmed; clicking the dimmed part closes it too.
 */
import { useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button, type ButtonProps } from './button';

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
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
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
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </div>
      </dialog>
    </>
  );
}
