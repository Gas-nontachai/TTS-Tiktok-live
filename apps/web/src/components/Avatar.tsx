import type { ChatMessageEvent } from "../types";

export function Avatar({ message }: { message: ChatMessageEvent }) {
  if (message.profilePictureUrl) {
    return <img className="avatar" src={message.profilePictureUrl} alt="" />;
  }

  return <div className="avatar fallback">{(message.displayName || message.username || "?").slice(0, 1).toUpperCase()}</div>;
}
