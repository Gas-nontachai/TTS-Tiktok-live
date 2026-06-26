import type { UserEventFields } from "../types";

export function Avatar({ message }: { message: UserEventFields }) {
  if (message.profilePictureUrl) {
    return <img className="h-[38px] w-[38px] shrink-0 rounded-full object-cover" src={message.profilePictureUrl} alt="" />;
  }

  return <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#1f7a72] font-extrabold text-white">{(message.displayName || message.username || "?").slice(0, 1).toUpperCase()}</div>;
}
