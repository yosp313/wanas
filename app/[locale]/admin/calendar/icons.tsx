const shapes = {
  previous: "m15 18-6-6 6-6",
  next: "m9 18 6-6-6-6",
  search: "M15.5 15.5 21 21 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  panel: "M3 4h18v16H3z M9 4v16",
  inbox: "M3 4h18v16H3z M3 13h5l2 3h4l2-3h5",
  calendar: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4",
  changes: "M4 10h16 M8 3v4 M16 3v4 M20 11V5H4v16h7 M14 20l1-4 4-4 3 3-4 4-4 1Z",
  pin: "M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 0 1 14 0Z M13 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  mail: "M3 5h18v14H3z M3 6l9 7 9-7",
  quote: "M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6",
  alert: "M12 3 2 20h20L12 3Z M12 9v4 M12 16v.1",
  check: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M8 12l3 3 5-6",
  budget: "M3 6h18v12H3z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M6 12h.1 M18 12h.1",
  catering: "M4 3v5a3 3 0 0 0 6 0V3 M7 3v18 M19 21V3c-3 2-4 5-4 9h4",
  bell: "M5 18h14l-2-3V9a5 5 0 1 0-10 0v6z M10 21h4",
  send: "m3 3 18 9-18 9 3-9-3-9Z M6 12h15",
  pending: "M10 5H5v16h6 M14 5h5v6 M9 3h6v4H9z M22 17a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z M17 14v3l2 1",
  trend: "m3 17 6-6 4 4 7-8 M15 7h5v5",
  sort: "M4 6h16 M4 12h11 M4 18h6",
} as const;

export function CalendarIcon({ name }: { name: keyof typeof shapes }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={shapes[name]} />
    </svg>
  );
}
