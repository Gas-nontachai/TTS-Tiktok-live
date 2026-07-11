import { useEffect, useState } from "react";
import { Eye, Pause, Play, RefreshCw, Trash2, X } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, TextArea, TextInput, NumberInput, RangeInput, SelectInput, ModalPortal, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { clearChat, pauseChat, resumeChat, blockChatUser, addBlacklistWord } from "../services/api";
import type { AppConfig, ChatEnterAnimationPreset, ChatExitAnimationPreset } from "../types";
import { buttonRowClass, chatEnterAnimations, chatExitAnimations, chatFontFamilies, panelClass, resolveCurrentWebUrl } from "../config/constants";
import { lines } from "../utils/helpers";
import { ChatPreviewWidget } from "../components/chat/ChatPreviewWidget";

export function ChatPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const chatPaused = useAppStore((state) => state.chatPaused);
  const [word, setWord] = useState("");
  const [username, setUsername] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReplayKey, setPreviewReplayKey] = useState(0);

  return (
    <Tabs defaultValue="overlay" className="grid w-full gap-0">
      <TabsList aria-label="Chat settings sections">
        <TabsTrigger value="overlay">Overlay</TabsTrigger>
        <TabsTrigger value="queue">Queue</TabsTrigger>
        <TabsTrigger value="theme">Theme</TabsTrigger>
        <TabsTrigger value="position">Position</TabsTrigger>
        <TabsTrigger value="filter">Filter</TabsTrigger>
        <TabsTrigger value="moderation">Moderation</TabsTrigger>
      </TabsList>
      <TabsContent value="overlay">
        <section className={panelClass}>
          <h2>Chat Overlay</h2>
          <CopyRow label="Chat Overlay URL" value={resolveCurrentWebUrl(config.chat.overlayUrl, "/overlay/chat")} />
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}><Eye size={16} />Preview widget</Button>
          <Toggle label="Enable Chat Overlay" checked={config.chat.enabled} onChange={(enabled) => patchConfig({ chat: { enabled } })} />
          <Toggle label="Show avatar" checked={config.chat.display.showAvatar} onChange={(showAvatar) => patchConfig({ chat: { display: { showAvatar } } })} />
          <Toggle label="Show timestamp" checked={config.chat.display.showTimestamp} onChange={(showTimestamp) => patchConfig({ chat: { display: { showTimestamp } } })} />
          <Toggle label="Compact mode" checked={config.chat.display.compactMode} onChange={(compactMode) => patchConfig({ chat: { display: { compactMode } } })} />
        </section>
      </TabsContent>
      <TabsContent value="queue">
        <section className={panelClass}>
          <h2>Queue & Animation</h2>
          <NumberInput label="Max visible messages" value={config.chat.queue.maxVisibleMessages} onChange={(maxVisibleMessages) => patchConfig({ chat: { queue: { maxVisibleMessages } } })} />
          <NumberInput label="Message lifetime ms" value={config.chat.queue.messageLifetimeMs} onChange={(messageLifetimeMs) => patchConfig({ chat: { queue: { messageLifetimeMs } } })} />
          <SelectInput label="Newest position" value={config.chat.queue.newestPosition} options={["bottom", "top"]} onChange={(newestPosition) => patchConfig({ chat: { queue: { newestPosition: newestPosition as "bottom" | "top" } } })} />
          <SelectInput label="New message animation" value={config.chat.animation.enterAnimation} options={chatEnterAnimations} onChange={(enterAnimation) => patchConfig({ chat: { animation: { enterAnimation: enterAnimation as ChatEnterAnimationPreset } } })} />
          <SelectInput label="Old message exit animation" value={config.chat.animation.exitAnimation} options={chatExitAnimations} onChange={(exitAnimation) => patchConfig({ chat: { animation: { exitAnimation: exitAnimation as ChatExitAnimationPreset } } })} />
          <NumberInput label="Enter duration ms" value={config.chat.animation.enterDurationMs} onChange={(enterDurationMs) => patchConfig({ chat: { animation: { enterDurationMs } } })} />
          <NumberInput label="Exit duration ms" value={config.chat.animation.exitDurationMs} onChange={(exitDurationMs) => patchConfig({ chat: { animation: { exitDurationMs } } })} />
          <Toggle label="Reduced motion" checked={config.chat.animation.reducedMotion} onChange={(reducedMotion) => patchConfig({ chat: { animation: { reducedMotion } } })} />
        </section>
      </TabsContent>
      <TabsContent value="theme">
        <section className={panelClass}>
          <h2>Theme</h2>
          <SelectInput label="Chat font family" value={config.chat.theme.fontFamily} options={chatFontFamilies} onChange={(fontFamily) => patchConfig({ chat: { theme: { fontFamily } } })} />
          <NumberInput label="Font size" value={config.chat.theme.fontSize} onChange={(fontSize) => patchConfig({ chat: { theme: { fontSize, messageFontSize: fontSize } } })} />
          <Toggle label="Emoji support" checked={config.chat.animation.emojiSupport} onChange={(emojiSupport) => patchConfig({ chat: { animation: { emojiSupport } } })} />
          <TextInput label="Text color" value={config.chat.theme.textColor} type="color" onChange={(textColor) => patchConfig({ chat: { theme: { textColor } } })} />
          <TextInput label="Username color" value={config.chat.theme.usernameColor} type="color" onChange={(usernameColor) => patchConfig({ chat: { theme: { usernameColor } } })} />
          <RangeInput label="Opacity" value={config.chat.theme.opacity} min={0} max={100} step={1} showNumberInput={false} valueLabel={`${config.chat.theme.opacity}%`} onChange={(opacity) => patchConfig({ chat: { theme: { opacity } } })} />
        </section>
      </TabsContent>
      <TabsContent value="position">
        <section className={panelClass}>
          <h2>Position</h2>
          <SelectInput label="Position" value={config.chat.position.position} options={["bottom-left", "bottom-right", "top-left", "top-right", "custom"]} onChange={(position) => patchConfig({ chat: { position: { position: position as typeof config.chat.position.position } } })} />
          <NumberInput label="Width" value={config.chat.position.width} onChange={(width) => patchConfig({ chat: { position: { width } } })} />
          <NumberInput label="Height" value={config.chat.position.height} onChange={(height) => patchConfig({ chat: { position: { height } } })} />
          <NumberInput label="Offset X" value={config.chat.position.offsetX} onChange={(offsetX) => patchConfig({ chat: { position: { offsetX } } })} />
          <NumberInput label="Offset Y" value={config.chat.position.offsetY} onChange={(offsetY) => patchConfig({ chat: { position: { offsetY } } })} />
        </section>
      </TabsContent>
      <TabsContent value="filter">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className={panelClass}>
            <h2>Chat Filter</h2>
            <Toggle label="Enable filter" checked={config.chat.filter.enabled} onChange={(enabled) => patchConfig({ chat: { filter: { enabled } } })} />
            <TextArea label="Blacklist words" value={config.chat.filter.blacklistWords.join("\n")} onChange={(value) => patchConfig({ chat: { filter: { blacklistWords: lines(value) } } })} />
            <TextArea label="Blocked usernames" value={config.chat.filter.blockedUsernames.join("\n")} onChange={(value) => patchConfig({ chat: { filter: { blockedUsernames: lines(value) } } })} />
          </section>
          <section className={panelClass}>
            <h2>Rules</h2>
            <Toggle label="Hide duplicates" checked={config.chat.filter.hideDuplicateMessages} onChange={(hideDuplicateMessages) => patchConfig({ chat: { filter: { hideDuplicateMessages } } })} />
            <NumberInput label="Duplicate window ms" value={config.chat.filter.duplicateWindowMs} onChange={(duplicateWindowMs) => patchConfig({ chat: { filter: { duplicateWindowMs } } })} />
            <NumberInput label="Max message length" value={config.chat.filter.maxMessageLength} onChange={(maxMessageLength) => patchConfig({ chat: { filter: { maxMessageLength } } })} />
            <Toggle label="Hide links" checked={config.chat.filter.hideLinks} onChange={(hideLinks) => patchConfig({ chat: { filter: { hideLinks } } })} />
            <Toggle label="Hide emoji-only" checked={config.chat.filter.hideEmojiOnlyMessages} onChange={(hideEmojiOnlyMessages) => patchConfig({ chat: { filter: { hideEmojiOnlyMessages } } })} />
          </section>
        </div>
      </TabsContent>
      <TabsContent value="moderation">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className={panelClass}>
            <h2>Moderation Actions</h2>
            <div className={buttonRowClass}>
              <Button variant="danger" onClick={() => void clearChat()}><Trash2 size={16} />Clear Chat</Button>
              <Button onClick={() => void pauseChat()} disabled={chatPaused}><Pause size={16} />Pause</Button>
              <Button onClick={() => void resumeChat()} disabled={!chatPaused}><Play size={16} />Resume</Button>
            </div>
            <TextInput label="Hide username" value={username} onChange={setUsername} />
            <Button onClick={() => username && void blockChatUser(username)}>Block User</Button>
            <TextInput label="Add blacklist word" value={word} onChange={setWord} />
            <Button onClick={() => word && void addBlacklistWord(word)}>Add Word</Button>
          </section>
          <section className={panelClass}>
            <h2>Recent Chat</h2>
            <div className="grid gap-2.5">
              {chatMessages.slice(0, 12).map((message) => (
                <article key={message.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-md border border-surfaceMuted bg-white p-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm text-text">{message.displayName || message.username}</strong>
                    <p className="mt-1 text-sm text-textMuted [overflow-wrap:anywhere]">{message.message}</p>
                  </div>
                  <Button variant="secondary" onClick={() => void blockChatUser(message.username)}>Block</Button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </TabsContent>
      <ChatPreviewModal
        open={previewOpen}
        config={config}
        replayKey={previewReplayKey}
        onReplay={() => setPreviewReplayKey((key) => key + 1)}
        onClose={() => setPreviewOpen(false)}
      />
    </Tabs>
  );
}

function ChatPreviewModal({
  open,
  config,
  replayKey,
  onReplay,
  onClose
}: {
  open: boolean;
  config: AppConfig;
  replayKey: number;
  onReplay: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (open && event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
        <button className="absolute inset-0 animate-dialog-overlay bg-black/60 backdrop-blur-[2px]" aria-label="Close preview" onClick={onClose} />
        <section className="relative grid w-full max-w-5xl animate-dialog-enter overflow-hidden rounded-lg bg-surface shadow-2xl ring-1 ring-surfaceMuted">
          <header className="flex items-center justify-between gap-3 border-b border-surfaceMuted px-4 py-3">
            <h3 className="text-base font-semibold text-text">Chat Widget Preview</h3>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onReplay}><RefreshCw size={16} />Restart loop</Button>
              <Button type="button" variant="danger" size="icon" aria-label="Close preview" onClick={onClose}><X size={16} /></Button>
            </div>
          </header>
          <div className="bg-[#141414] p-4 sm:p-5">
            <div className="relative h-[560px] overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_25%,transparent_25%),linear-gradient(225deg,rgba(255,255,255,0.08)_25%,transparent_25%),linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%),linear-gradient(315deg,rgba(255,255,255,0.08)_25%,#1f1f1f_25%)] bg-[length:32px_32px] bg-[position:16px_0,16px_0,0_0,0_0]">
              <ChatPreviewWidget key={replayKey} config={config} />
            </div>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
