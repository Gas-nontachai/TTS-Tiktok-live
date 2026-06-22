import { useAppStore } from "../stores/appStore";
import { LogList } from "../components";

export function LogsPage() {
  const logs = useAppStore((state) => state.logs);

  return (
    <section className="panel">
      <h2>Logs</h2>
      <LogList logs={logs} />
    </section>
  );
}
