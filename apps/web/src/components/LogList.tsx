type LogEntry = {
  id: string;
  level: string;
  type: string;
  message: string;
  timestamp: number;
};

export function LogList({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="log-list">
      {logs.length === 0 ? <p className="quiet">No logs yet.</p> : null}
      {logs.map((log) => (
        <article key={log.id}>
          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
          <strong>{log.type}</strong>
          <p>{log.message}</p>
        </article>
      ))}
    </div>
  );
}
