const shapes = {
  previous: "m15 18-6-6 6-6",
  next: "m9 18 6-6-6-6",
  search: "M15.5 15.5 21 21 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  panel: "M3 4h18v16H3z M9 4v16",
  inbox: "M3 4h18v16H3z M3 13h5l2 3h4l2-3h5",
  calendar: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4",
  changes: "M4 10h16 M8 3v4 M16 3v4 M20 11V5H4v16h7 M14 20l1-4 4-4 3 3-4 4-4 1Z",
  pin: "M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 0 1 14 0Z M13 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
} as const;

export function CalendarIcon({ name }: { name: keyof typeof shapes }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={shapes[name]} />
    </svg>
  );
}
