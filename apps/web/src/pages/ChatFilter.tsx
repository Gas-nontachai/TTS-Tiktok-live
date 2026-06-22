import { useAppStore } from "../stores/appStore";
import { Button, Toggle, TextArea, NumberInput } from "../components/ui";
import { saveConfig } from "../services/api";
import { lines } from "../utils/helpers";

export function ChatFilterPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);

  return (
    <div className="page-grid two">
      <section className="panel">
        <h2>Chat Filter</h2>
        <Toggle label="Enable filter" checked={config.chat.filter.enabled} onChange={(enabled) => patchConfig({ chat: { filter: { enabled } } })} />
        <TextArea label="Blacklist words" value={config.chat.filter.blacklistWords.join("\n")} onChange={(value) => patchConfig({ chat: { filter: { blacklistWords: lines(value) } } })} />
        <TextArea label="Blocked usernames" value={config.chat.filter.blockedUsernames.join("\n")} onChange={(value) => patchConfig({ chat: { filter: { blockedUsernames: lines(value) } } })} />
      </section>
      <section className="panel">
        <h2>Rules</h2>
        <Toggle label="Hide duplicates" checked={config.chat.filter.hideDuplicateMessages} onChange={(hideDuplicateMessages) => patchConfig({ chat: { filter: { hideDuplicateMessages } } })} />
        <NumberInput label="Duplicate window ms" value={config.chat.filter.duplicateWindowMs} onChange={(duplicateWindowMs) => patchConfig({ chat: { filter: { duplicateWindowMs } } })} />
        <NumberInput label="Max message length" value={config.chat.filter.maxMessageLength} onChange={(maxMessageLength) => patchConfig({ chat: { filter: { maxMessageLength } } })} />
        <Toggle label="Hide links" checked={config.chat.filter.hideLinks} onChange={(hideLinks) => patchConfig({ chat: { filter: { hideLinks } } })} />
        <Toggle label="Hide emoji-only" checked={config.chat.filter.hideEmojiOnlyMessages} onChange={(hideEmojiOnlyMessages) => patchConfig({ chat: { filter: { hideEmojiOnlyMessages } } })} />
        <Button onClick={() => void saveConfig(config)}>Save Filters</Button>
      </section>
    </div>
  );
}
