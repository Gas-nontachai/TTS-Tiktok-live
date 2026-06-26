type LogEntry = {
  id: string;
  level: string;
  type: string;
  message: string;
  timestamp: number;
};

export function LogList({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="flex max-h-[520px] flex-col gap-2 overflow-auto">
      {logs.length === 0 ? <p className="mt-1 text-sm text-textMuted">No logs yet.</p> : null}
      {logs.map((log) => (
        <article key={log.id} className="rounded-md border border-[#e6e1d8] bg-white p-2.5">
          <span className="text-xs text-[#777266]">{new Date(log.timestamp).toLocaleTimeString()}</span>
          <strong className="ml-2 inline-block text-[#155f5a]">{log.type}</strong>
          <p className="mt-1">{log.message}</p>
        </article>
      ))}
    </div>
  );
}
