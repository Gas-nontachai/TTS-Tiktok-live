import { useAppStore } from "../stores/appStore";
import { TextInput } from "./ui";

export function ConnectionControls() {
  const patchConfig = useAppStore((state) => state.patchConfig);
  const config = useAppStore((state) => state.config);

  return (
    <>
      <TextInput label="TikTok Username" value={config.tiktok.username} onChange={(username) => patchConfig({ tiktok: { username } })} />
    </>
  );
}
