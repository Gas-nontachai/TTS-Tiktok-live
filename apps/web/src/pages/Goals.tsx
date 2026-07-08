import { useEffect, useState } from "react";
import { Heart, Plus, Trash2, UserPlus } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Button, NumberInput, SelectInput, TextInput, Toggle, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { resetGoal, saveConfig, testGoalProgress } from "../services/api";
import type { GoalResetMode, GoalType, GoalVisualTemplate } from "../types";
import { buttonRowClass, formGridClass, panelClass, transparentPreviewClass } from "../config/constants";
import { GoalWidget } from "./overlays/OverlayPages";

const goalTypes: GoalType[] = ["like", "follow"];
const resetModes: GoalResetMode[] = ["session", "manual", "persistent"];
const goalVisualTemplates: Array<{ id: GoalVisualTemplate; label: string }> = [
  { id: "event-bar", label: "Event bar" },
  { id: "neon-slab", label: "Neon slab" },
  { id: "quest-meter", label: "Quest meter" },
  { id: "score-strip", label: "Score strip" }
];

const goalPresets: Record<"like" | "follow", { title: string; targetValue: number }> = {
  like: {
    title: "เป้าหมายไลค์",
    targetValue: 10000
  },
  follow: {
    title: "เป้าหมายผู้ติดตาม",
    targetValue: 100
  }
};

export function GoalsPage() {
  const config = useAppStore((state) => state.config);
  const patchConfig = useAppStore((state) => state.patchConfig);
  const goals = config.goals;
  const [activeGoalId, setActiveGoalId] = useState(goals[0]?.id ?? "");

  useEffect(() => {
    if (!goals.length) {
      setActiveGoalId("");
      return;
    }

    if (!goals.some((goal) => goal.id === activeGoalId)) {
      setActiveGoalId(goals[0].id);
    }
  }, [activeGoalId, goals]);

  function setGoals(nextGoals: typeof goals) {
    patchConfig({ goals: nextGoals });
  }

  function updateGoal(id: string, patch: Partial<(typeof goals)[number]>) {
    setGoals(goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)));
  }

  function addGoal(type: "like" | "follow") {
    const now = Date.now();
    const id = `goal_${type}_${now}`;
    const preset = goalPresets[type];
    setGoals([
      ...goals,
      {
        id,
        title: preset.title,
        type,
        currentValue: 0,
        targetValue: preset.targetValue,
        visualTemplate: "event-bar",
        enabled: true,
        isPaused: false,
        resetMode: "session",
        triggerAlertOnComplete: true,
        completed: false
      }
    ]);
    setActiveGoalId(id);
  }

  function removeGoal(id: string) {
    setGoals(goals.filter((goal) => goal.id !== id));
  }

  return (
    <div className="grid w-full gap-3">
      <section className={`${panelClass} col-span-full`}>
        <div className="flex items-center justify-between gap-3">
          <h2>Live Goals</h2>
          <div className={buttonRowClass}>
            <Button onClick={() => addGoal("like")}><Heart size={16} />Add Like Goal</Button>
            <Button onClick={() => addGoal("follow")}><UserPlus size={16} />Add Follower Goal</Button>
          </div>
        </div>
      </section>
      {goals.length ? (
        <Tabs value={activeGoalId} onValueChange={setActiveGoalId}>
          <TabsList aria-label="Live goal settings">
            {goals.map((goal, index) => (
              <TabsTrigger key={goal.id} value={goal.id}>{goal.title || `Goal ${index + 1}`}</TabsTrigger>
            ))}
          </TabsList>
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            return (
              <TabsContent value={goal.id} key={goal.id}>
                <section className={panelClass}>
                  <div className="flex items-center justify-between gap-3">
                    <h2>{goal.title}</h2>
                    <Button variant="secondary" onClick={() => removeGoal(goal.id)}><Trash2 size={16} />Delete</Button>
                  </div>
                  <div className="grid gap-2">
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#e7e2d8]">
                      <span className="block h-full rounded-full bg-gradient-to-r from-[#69d391] to-[#f7c948] transition-[width] duration-200" style={{ width: `${percent}%` }} />
                    </div>
                    <p>{percent}% complete</p>
                  </div>
                  <TextInput label="Title" value={goal.title} onChange={(title) => updateGoal(goal.id, { title })} />
                  <div className="grid gap-3">
                    <div className={`overflow-hidden rounded-md border border-surfaceMuted p-6 ${transparentPreviewClass}`}>
                      <GoalWidget goal={{ ...goal, enabled: true, visualTemplate: goal.visualTemplate ?? "event-bar" }} />
                    </div>
                    <div className="grid gap-2">
                      <span className="text-sm font-semibold text-text">Overlay template</span>
                      <div className="grid grid-cols-1 gap-2 xl:grid-cols-4">
                        {goalVisualTemplates.map((template) => {
                          const selected = (goal.visualTemplate ?? "event-bar") === template.id;
                          const previewGoal = {
                            ...goal,
                            title: goal.title || template.label,
                            currentValue: goal.currentValue || Math.round(goal.targetValue * 0.48),
                            visualTemplate: template.id
                          };
                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => updateGoal(goal.id, { visualTemplate: template.id })}
                              className={`grid min-h-[116px] overflow-hidden rounded-md border p-2 text-left transition ${transparentPreviewClass} ${selected ? "border-sage ring-2 ring-sage/25" : "border-surfaceMuted hover:border-sage/60"}`}
                            >
                              <span className="text-xs font-black uppercase text-white/75">{template.label}</span>
                              <div className="h-[72px] overflow-hidden">
                                <div className="w-[720px] scale-[0.46] [transform-origin:left_top] sm:scale-[0.56] xl:scale-[0.42]">
                                  <GoalWidget goal={previewGoal} />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={formGridClass}>
                    <SelectInput label="Goal type" value={goal.type} options={goalTypes} onChange={(type) => updateGoal(goal.id, { type: type as GoalType })} />
                    <NumberInput label="Current" value={goal.currentValue} onChange={(currentValue) => updateGoal(goal.id, { currentValue, completed: currentValue >= goal.targetValue })} />
                    <NumberInput label="Target" value={goal.targetValue} onChange={(targetValue) => updateGoal(goal.id, { targetValue, completed: goal.currentValue >= targetValue })} />
                    <SelectInput label="Reset mode" value={goal.resetMode} options={resetModes} onChange={(resetMode) => updateGoal(goal.id, { resetMode: resetMode as GoalResetMode })} />
                    <Toggle label="Enabled" checked={goal.enabled} onChange={(enabled) => updateGoal(goal.id, { enabled })} />
                    <Toggle label="Paused" checked={goal.isPaused} onChange={(isPaused) => updateGoal(goal.id, { isPaused })} />
                    <Toggle label="Goal alert" checked={goal.triggerAlertOnComplete} onChange={(triggerAlertOnComplete) => updateGoal(goal.id, { triggerAlertOnComplete })} />
                  </div>
                  <div className={buttonRowClass}>
                    <Button onClick={() => void testGoalProgress(goal.id, Math.max(1, Math.ceil(goal.targetValue / 10)))}>Test Progress</Button>
                    <Button variant="secondary" onClick={() => void resetGoal(goal.id)}>Reset</Button>
                  </div>
                </section>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <section className={panelClass}>
          <h2>No goals yet</h2>
          <div className={buttonRowClass}>
            <Button onClick={() => addGoal("like")}><Plus size={16} />Add Like Goal</Button>
            <Button onClick={() => addGoal("follow")}><UserPlus size={16} />Add Follower Goal</Button>
          </div>
        </section>
      )}
      <section className={`${panelClass} col-span-full`}>
        <Button onClick={() => void saveConfig(config)}>Save Goals</Button>
      </section>
    </div>
  );
}
