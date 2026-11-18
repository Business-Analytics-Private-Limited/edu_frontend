/**
 * The signed-in person in the header: initials in a circle, name and a detail line.
 *
 *   <UserBadge name="Lakshmi Rao" detail="Institution admin" />
 */
export interface UserBadgeProps {
  name: string;
  detail?: string;
}

export function UserBadge({ name, detail }: UserBadgeProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <div className="text-sm font-medium leading-tight">{name}</div>
        {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
      </div>
      <div
        aria-hidden
        className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        {initials}
      </div>
    </div>
  );
}
