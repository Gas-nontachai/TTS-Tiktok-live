import { useState } from "react";
import { useAppStore } from "../stores/appStore";
import { Button, CopyRow, Toggle, TextInput, NumberInput, SelectInput } from "../components/ui";
import { saveConfig, testChatMessage } from "../services/api";
import type { ChatAnimationPreset } from "../types";
import { chatAnimations, overlayChatUrl } from "../config/constants";

export function ChatPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const [message, setMessage] = useState("สวัสดีครับ นี่คือข้อความทดสอบ");

  async function persist() {
    const next = await saveConfig(config);
    useAppStore.getState().setConfig(next);
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <h2>Chat Overlay</h2>
        <CopyRow label="Chat Overlay URL" value={config.chat.overlayUrl || overlayChatUrl} />
        <Toggle label="Enable Chat Overlay" checked={config.chat.enabled} onChange={(enabled) => patchConfig({ chat: { enabled } })} />
        <Toggle label="Show avatar" checked={config.chat.display.showAvatar} onChange={(showAvatar) => patchConfig({ chat: { display: { showAvatar } } })} />
        <Toggle label="Show timestamp" checked={config.chat.display.showTimestamp} onChange={(showTimestamp) => patchConfig({ chat: { display: { showTimestamp } } })} />
        <Toggle label="Compact mode" checked={config.chat.display.compactMode} onChange={(compactMode) => patchConfig({ chat: { display: { compactMode } } })} />
      </section>
      <section className="panel">
        <h2>Queue & Animation</h2>
        <NumberInput label="Max visible messages" value={config.chat.queue.maxVisibleMessages} onChange={(maxVisibleMessages) => patchConfig({ chat: { queue: { maxVisibleMessages } } })} />
        <NumberInput label="Message lifetime ms" value={config.chat.queue.messageLifetimeMs} onChange={(messageLifetimeMs) => patchConfig({ chat: { queue: { messageLifetimeMs } } })} />
        <SelectInput label="Newest position" value={config.chat.queue.newestPosition} options={["bottom", "top"]} onChange={(newestPosition) => patchConfig({ chat: { queue: { newestPosition: newestPosition as "bottom" | "top" } } })} />
        <SelectInput label="Enter animation" value={config.chat.animation.enterAnimation} options={chatAnimations} onChange={(enterAnimation) => patchConfig({ chat: { animation: { enterAnimation: enterAnimation as ChatAnimationPreset } } })} />
        <SelectInput label="Exit animation" value={config.chat.animation.exitAnimation} options={["none", "fade", "slide-up", "slide-left", "slide-right"]} onChange={(exitAnimation) => patchConfig({ chat: { animation: { exitAnimation: exitAnimation as typeof config.chat.animation.exitAnimation } } })} />
      </section>
      <section className="panel">
        <h2>Theme</h2>
        <NumberInput label="Font size" value={config.chat.theme.fontSize} onChange={(fontSize) => patchConfig({ chat: { theme: { fontSize, messageFontSize: fontSize } } })} />
        <TextInput label="Text color" value={config.chat.theme.textColor} type="color" onChange={(textColor) => patchConfig({ chat: { theme: { textColor } } })} />
        <TextInput label="Username color" value={config.chat.theme.usernameColor} type="color" onChange={(usernameColor) => patchConfig({ chat: { theme: { usernameColor } } })} />
        <TextInput label="Bubble color" value={config.chat.theme.bubbleColor} onChange={(bubbleColor) => patchConfig({ chat: { theme: { bubbleColor } } })} />
        <NumberInput label="Opacity" value={config.chat.theme.opacity} onChange={(opacity) => patchConfig({ chat: { theme: { opacity } } })} />
      </section>
      <section className="panel">
        <h2>Position</h2>
        <SelectInput label="Position" value={config.chat.position.position} options={["bottom-left", "bottom-right", "top-left", "top-right", "custom"]} onChange={(position) => patchConfig({ chat: { position: { position: position as typeof config.chat.position.position } } })} />
        <NumberInput label="Width" value={config.chat.position.width} onChange={(width) => patchConfig({ chat: { position: { width } } })} />
        <NumberInput label="Height" value={config.chat.position.height} onChange={(height) => patchConfig({ chat: { position: { height } } })} />
        <NumberInput label="Offset X" value={config.chat.position.offsetX} onChange={(offsetX) => patchConfig({ chat: { position: { offsetX } } })} />
        <NumberInput label="Offset Y" value={config.chat.position.offsetY} onChange={(offsetY) => patchConfig({ chat: { position: { offsetY } } })} />
      </section>
      <section className="panel wide">
        <h2>Test Chat</h2>
        <TextInput label="Test message" value={message} onChange={setMessage} />
        <div className="button-row">
          <Button onClick={() => void testChatMessage(message)}>Test Chat</Button>
          <Button onClick={persist}>Save Chat Config</Button>
        </div>
      </section>
    </div>
  );
}
