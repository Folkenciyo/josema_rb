import { cn } from "@/lib/cn";

/**
 * The one way a table behaves on a phone: the first column stays pinned to the
 * left and the rest is dragged with a finger, inside a box that never widens
 * the page.
 *
 * `min-w-0` is the whole trick. A child of a grid or a flex row does not shrink
 * below the width of its own content unless it is told to, so a table of ten
 * nowrap columns stretches its card, its grid and the document with it — which
 * is exactly how the client's page ended up 1206px wide on a 390px screen.
 * With a minimum of zero the box takes the width it is given and the overflow
 * becomes what it should have been all along: a scroll of its own.
 */
export function ScrollTable({
  children,
  className,
  stickyColumn = true,
}: {
  /** `thead` and `tbody`; the `table` element is this component's. */
  children: React.ReactNode;
  /**
   * For the box, not the table: `max-h-72` to cap how tall it grows, and the
   * type size, which the table inherits.
   */
  className?: string;
  /** Pin the first column. Off for tables whose first column is not the key. */
  stickyColumn?: boolean;
}) {
  return (
    <div
      className={cn("w-full min-w-0 overflow-auto contain-paint", className)}
    >
      <table
        className={cn(
          "w-full",
          // The pinned column needs its own background, or the columns being
          // dragged would read straight through it.
          stickyColumn &&
            "[&_tr>:first-child]:bg-surface [&_thead_tr>:first-child]:z-20 [&_tr>:first-child]:sticky [&_tr>:first-child]:left-0 [&_tr>:first-child]:z-10 [&_tr>:first-child]:shadow-[1px_0_0_0_var(--color-slate-200)]",
        )}
      >
        {children}
      </table>
    </div>
  );
}
