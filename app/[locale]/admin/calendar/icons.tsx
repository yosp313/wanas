import {
  LuBanknote, LuBell, LuCalendarDays, LuChevronLeft, LuChevronRight,
  LuCircleCheck, LuClipboardList, LuFilePenLine, LuFileText, LuInbox,
  LuListFilter, LuMail, LuMapPin, LuPanelLeft, LuSearch, LuSend,
  LuTrendingUp, LuTriangleAlert, LuUtensils,
} from "react-icons/lu";

const icons = {
  previous: LuChevronLeft,
  next: LuChevronRight,
  search: LuSearch,
  panel: LuPanelLeft,
  inbox: LuInbox,
  calendar: LuCalendarDays,
  changes: LuFilePenLine,
  pin: LuMapPin,
  mail: LuMail,
  quote: LuFileText,
  alert: LuTriangleAlert,
  check: LuCircleCheck,
  budget: LuBanknote,
  catering: LuUtensils,
  bell: LuBell,
  send: LuSend,
  pending: LuClipboardList,
  trend: LuTrendingUp,
  sort: LuListFilter,
};

export function CalendarIcon({ name }: { name: keyof typeof icons }) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" size={20} strokeWidth={1.75} />;
}
