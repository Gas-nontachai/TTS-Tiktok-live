import { useEffect, useRef, useState } from "react";
import type { AppConfig, ChatMessageEvent } from "../../types";
import { Avatar } from "../Avatar";
import { cn } from "../../lib/utils";
import { chatEnterAnimationClass, chatExitAnimationClass, chatFontStack } from "../../utils/helpers";

type ChatPreviewWidgetProps = {
  config: AppConfig;
};

type ChatPreviewMessage = ChatMessageEvent & { phase: "entering" | "visible" | "exiting" };

export function ChatPreviewWidget({ config }: ChatPreviewWidgetProps) {
  const theme = config.chat.theme;
  const reducedMotion = config.chat.animation.reducedMotion;
  const enterDurationMs = reducedMotion ? 120 : config.chat.animation.enterDurationMs || config.chat.animation.durationMs;
  const exitDurationMs = reducedMotion ? 120 : config.chat.animation.exitDurationMs || config.chat.animation.durationMs;
  const [messages, setMessages] = useState<ChatPreviewMessage[]>([]);
  const timersRef = useRef<Array<ReturnType<typeof window.setTimeout>>>([]);
  const samplesRef = useRef(previewMessages());
  const indexRef = useRef(0);
  const sequenceRef = useRef(0);
  const ordered = config.chat.display.messageOrder === "newest-first" ? [...messages].reverse() : messages;

  useEffect(() => {
    const timers = timersRef.current;

    function queue(callback: () => void, delayMs: number) {
      const timer = window.setTimeout(callback, delayMs);
      timers.push(timer);
      return timer;
    }

    function removeMessage(id: string) {
      setMessages((items) => items.filter((message) => message.id !== id));
    }

    function exitMessage(id: string) {
      if (!config.chat.animation.enabled || config.chat.animation.exitAnimation === "none") {
        removeMessage(id);
        return;
      }

      setMessages((items) => items.map((message) => (message.id === id ? { ...message, phase: "exiting" } : message)));
      queue(() => removeMessage(id), exitDurationMs + 120);
    }

    function addMessage() {
      const sample = samplesRef.current[indexRef.current % samplesRef.current.length];
      const sequence = sequenceRef.current;
      indexRef.current += 1;
      sequenceRef.current += 1;

      const nextMessage: ChatPreviewMessage = {
        ...sample,
        id: `${sample.id}-${sequence}`,
        timestamp: Date.now(),
        phase: "entering"
      };

      setMessages((items) => {
        const next = config.chat.queue.newestPosition === "top" ? [nextMessage, ...items] : [...items, nextMessage];
        const active = next.filter((message) => message.phase !== "exiting");
        const overflowCount = Math.max(0, active.length - config.chat.queue.maxVisibleMessages);
        const overflowIds = new Set(
          overflowCount > 0
            ? (config.chat.queue.newestPosition === "top" ? active.slice(-overflowCount) : active.slice(0, overflowCount)).map((message) => message.id)
            : []
        );
        overflowIds.forEach((id) => queue(() => removeMessage(id), config.chat.animation.exitAnimation === "none" ? 0 : exitDurationMs + 120));

        return next.map((message) => (overflowIds.has(message.id) ? { ...message, phase: "exiting" } : message));
      });

      queue(() => {
        setMessages((items) => items.map((message) => (message.id === nextMessage.id ? { ...message, phase: "visible" } : message)));
      }, enterDurationMs);
      queue(() => exitMessage(nextMessage.id), enterDurationMs + 3000);
    }

    setMessages([]);
    indexRef.current = 0;
    sequenceRef.current = 0;
    addMessage();
    const interval = window.setInterval(addMessage, Math.max(900, Math.min(1600, enterDurationMs + 900)));

    return () => {
      window.clearInterval(interval);
      timers.splice(0).forEach((timer) => window.clearTimeout(timer));
    };
  }, [
    config.chat.animation.enabled,
    config.chat.animation.exitAnimation,
    config.chat.queue.maxVisibleMessages,
    config.chat.queue.newestPosition,
    enterDurationMs,
    exitDurationMs
  ]);

  return (
    <div className="absolute inset-x-4 bottom-4 flex max-h-[calc(100%-2rem)] flex-col justify-end overflow-hidden sm:left-8 sm:right-auto sm:w-[min(520px,calc(100%-4rem))]">
      {ordered.map((message) => {
        return (
          <article
            key={message.id}
            dir="auto"
            onAnimationEnd={() => {
              if (message.phase === "exiting") {
                setMessages((items) => items.filter((item) => item.id !== message.id));
              }
            }}
            className={cn(
              "flex items-start gap-2.5 border border-transparent leading-[1.28] [overflow-wrap:anywhere] [unicode-bidi:plaintext]",
              config.chat.display.compactMode ? "block" : "",
              config.chat.animation.enabled && message.phase === "entering" ? chatEnterAnimationClass(reducedMotion ? "fade-in" : config.chat.animation.enterAnimation) : "",
              config.chat.animation.enabled && message.phase === "exiting" ? chatExitAnimationClass(reducedMotion ? "fade-out" : config.chat.animation.exitAnimation) : ""
            )}
            style={{
              color: theme.textColor,
              fontFamily: chatFontStack(theme.fontFamily, config.chat.animation.emojiSupport),
              fontSize: theme.messageFontSize,
              background: "transparent",
              borderColor: "transparent",
              borderRadius: 0,
              opacity: message.phase === "exiting" ? 0 : theme.opacity / 100,
              padding: 0,
              marginBottom: theme.spacing,
              transform: message.phase === "exiting" ? chatPreviewExitTransform(reducedMotion ? "fade-out" : config.chat.animation.exitAnimation) : undefined,
              filter: message.phase === "exiting" && config.chat.animation.exitAnimation === "glitch-out" ? "hue-rotate(-45deg)" : undefined,
              transition: message.phase === "exiting" ? `opacity ${exitDurationMs}ms ease-in, transform ${exitDurationMs}ms ease-in, filter ${exitDurationMs}ms steps(2, end), margin ${exitDurationMs}ms ease-in` : undefined,
              animationDuration: `${message.phase === "exiting" ? exitDurationMs : enterDurationMs}ms`,
              boxShadow: "none",
              textShadow: "0 2px 6px rgba(0,0,0,0.55)"
            }}
          >
            {config.chat.display.showAvatar && !config.chat.display.compactMode ? <Avatar message={message} /> : null}
            <div className="min-w-0">
              <header className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                {config.chat.display.showDisplayName ? <strong style={{ color: theme.usernameColor, fontSize: theme.usernameFontSize }}>{message.displayName || message.username}</strong> : null}
                {config.chat.display.showUsername ? <span className="text-[0.85em] opacity-70">@{message.username}</span> : null}
                {config.chat.display.showTimestamp ? <time className="text-[0.8em] opacity-60">{new Date(message.timestamp).toLocaleTimeString()}</time> : null}
              </header>
              <p className="m-0 whitespace-pre-wrap" dir="auto">{message.message}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function chatPreviewExitTransform(animation: string) {
  switch (animation) {
    case "slide-up":
      return "translateY(-22px)";
    case "drift-away":
      return "translate(22px, -30px)";
    case "shrink-out":
      return "scale(0.86)";
    case "glitch-out":
      return "translateX(14px)";
    case "slide-left":
      return "translateX(-32px)";
    case "slide-right":
      return "translateX(32px)";
    default:
      return "translateY(-4px)";
  }
}

function previewMessages(): ChatMessageEvent[] {
  const now = Date.now();
  return [
    { id: "preview-1", type: "chat_message", timestamp: now - 7000, username: "mali_live", displayName: "มะลิ Live", profilePictureUrl: "", message: "สวัสดีค่า วันนี้เสียงชัดมาก 💖✨" },
    { id: "preview-2", type: "chat_message", timestamp: now - 6000, username: "tokyo_neko", displayName: "東京ねこ", profilePictureUrl: "", message: "日本語もきれいに見えます！🎌" },
    { id: "preview-3", type: "chat_message", timestamp: now - 5000, username: "kim_stream", displayName: "김하늘", profilePictureUrl: "", message: "한국어 테스트 완료 👍🏽🔥" },
    { id: "preview-4", type: "chat_message", timestamp: now - 4000, username: "lin_cn", displayName: "林小雨", profilePictureUrl: "", message: "中文字符和 emoji 一起显示 🚀❤️" },
    { id: "preview-5", type: "chat_message", timestamp: now - 3000, username: "amira", displayName: "أميرة", profilePictureUrl: "", message: "مرحبا بالجميع، العرض واضح 😊" },
    { id: "preview-6", type: "chat_message", timestamp: now - 2000, username: "devan", displayName: "देवन", profilePictureUrl: "", message: "हिंदी + English + ไทย mixed text works kaomoji (づ｡◕‿‿◕｡)づ" },
    { id: "preview-7", type: "chat_message", timestamp: now - 1000, username: "longword", displayName: "Wrap Test", profilePictureUrl: "", message: "supercalifragilisticexpialidociousไม่มีเว้นวรรคแต่ต้องตัดบรรทัดได้ -> OK" }
  ];
}
