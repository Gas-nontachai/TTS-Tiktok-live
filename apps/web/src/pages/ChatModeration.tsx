import { useState } from "react";
import { Trash2, Pause, Play } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, TextInput } from "../components/ui";
import { clearChat, pauseChat, resumeChat, blockChatUser, addBlacklistWord } from "../services/api";

export function ChatModerationPage() {
  const chatMessages = useAppStore((state) => state.chatMessages);
  const chatPaused = useAppStore((state) => state.chatPaused);
  const [word, setWord] = useState("");
  const [username, setUsername] = useState("");

  return (
    <div className="page-grid two">
      <section className="panel">
        <h2>Moderation Actions</h2>
        <div className="button-row">
          <Button variant="danger" onClick={() => void clearChat()}><Trash2 size={16} />Clear Chat</Button>
          <Button onClick={() => void pauseChat()} disabled={chatPaused}><Pause size={16} />Pause</Button>
          <Button onClick={() => void resumeChat()} disabled={!chatPaused}><Play size={16} />Resume</Button>
        </div>
        <TextInput label="Hide username" value={username} onChange={setUsername} />
        <Button onClick={() => username && void blockChatUser(username)}>Block User</Button>
        <TextInput label="Add blacklist word" value={word} onChange={setWord} />
        <Button onClick={() => word && void addBlacklistWord(word)}>Add Word</Button>
      </section>
      <section className="panel">
        <h2>Recent Chat</h2>
        <div className="chat-admin-list">
          {chatMessages.slice(0, 12).map((message) => (
            <article key={message.id}>
              <strong>{message.displayName || message.username}</strong>
              <p>{message.message}</p>
              <Button variant="secondary" onClick={() => void blockChatUser(message.username)}>Block</Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
