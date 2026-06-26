import { useAppStore } from "../stores/appStore";
import { LogList } from "../components";
import { panelClass } from "../config/constants";

export function LogsPage() {
  const logs = useAppStore((state) => state.logs);

  return (
    <section className={panelClass}>
      <h2>Logs</h2>
      <LogList logs={logs} />
    </section>
  );
}
