import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { AnimatedCheck } from "@/components/AnimatedComponents";
import { Circle, CheckSquare, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBadges } from "@/hooks/useBadges";
import { NOTIFICATION_TRIGGERS } from "@/components/NotificationCenter";
import { tasksApi } from "@/lib/api";
import toast from "react-hot-toast";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export default function Tasks() {
  const { user, profile, updateProfile, addXp } = useAuth();
  const { checkBadges } = useBadges();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);

  // Load tasks from database
  useEffect(() => {
    if (!user) return;
    const loadTasks = async () => {
      const data = await tasksApi.list().catch(() => []);
      setTodos(data as TodoItem[]);
      setLoading(false);
    };
    loadTasks();
  }, [user]);

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;
    const data = await tasksApi.create(newTodo.trim()).catch(() => null);
    if (data) setTodos(prev => [data as TodoItem, ...prev]);
    setNewTodo("");
  };

  const toggleTodo = async (id: string) => {
    const item = todos.find(t => t.id === id);
    if (!item) return;
    const completing = !item.completed;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: completing } : t));
    await tasksApi.update(id, { completed: completing }).catch(() => null);
    if (completing) {
      await addXp(10, "To-do completed!");
      setTimeout(() => checkBadges(), 500);
      toast.success("Task done! +10 XP ✅");
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await tasksApi.delete(id).catch(() => null);
  };

  // Also show roadmap tasks
  const roadmap = profile?.roadmap_data as { milestones?: Array<{ title: string; tasks?: Array<{ id: string; title: string; xp?: number }> }> };
  const milestones = roadmap?.milestones || [];
  const completedTasks = (profile?.completed_tasks || []) as string[];
  const roadmapTasks = milestones.flatMap((m) =>
    (m.tasks || []).map((t) => ({ ...t, milestone: m.title }))
  );
  const pendingRoadmapTasks = roadmapTasks.filter((t) => !completedTasks.includes(t.id));

  const toggleRoadmapTask = async (taskId: string, taskXp: number, taskTitle: string) => {
    const isCompleting = !completedTasks.includes(taskId);
    const newCompleted = isCompleting
      ? [...completedTasks, taskId]
      : completedTasks.filter((t) => t !== taskId);
    await updateProfile({ completed_tasks: newCompleted });
    if (isCompleting) {
      await addXp(taskXp, "Task completed!");
      NOTIFICATION_TRIGGERS.taskComplete(taskTitle, taskXp);
      setTimeout(() => checkBadges(), 500);
    }
  };

  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <PageTransition>
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <span className="icon-box icon-box-success h-9 w-9 rounded-lg"><CheckSquare className="h-5 w-5" /></span>
          Tasks & To-Do
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Track your personal tasks and roadmap progress</p>

        {/* Add new to-do */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTodo()}
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button onClick={addTodo} className="btn-primary px-4 py-2.5 flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {/* Personal To-dos */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Personal Tasks ({pendingTodos.length})
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 animate-pulse">
                  <div className="h-5 w-5 rounded-full bg-muted" />
                  <div className="flex-1 h-4 rounded bg-muted" style={{ width: `${60 + Math.random() * 30}%` }} />
                  <div className="h-4 w-4 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              {pendingTodos.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks. Add one above! 🎉</p>
              )}
              {pendingTodos.map(todo => (
                <motion.div key={todo.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 mb-2 hover:border-border-hover transition-colors"
                >
                  <button onClick={() => toggleTodo(todo.id)}>
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <span className="flex-1 text-sm text-foreground">{todo.text}</span>
                  <button onClick={() => deleteTodo(todo.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {completedTodos.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                {completedTodos.length} completed
              </summary>
              <div className="mt-2 space-y-1">
                {completedTodos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 opacity-50">
                    <AnimatedCheck size={18} />
                    <span className="flex-1 text-sm text-muted-foreground line-through">{todo.text}</span>
                    <button onClick={() => deleteTodo(todo.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Roadmap Tasks */}
        {roadmapTasks.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Roadmap Tasks ({pendingRoadmapTasks.length} pending)
            </h2>
            {pendingRoadmapTasks.slice(0, 10).map((task: { id: string; title: string; description?: string; xp?: number; milestone: string }) => (
              <motion.div key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 rounded-lg border border-border p-3 mb-2"
              >
                <button onClick={() => toggleRoadmapTask(task.id, task.xp || 25, task.title)} className="mt-0.5">
                  {completedTasks.includes(task.id)
                    ? <AnimatedCheck size={18} />
                    : <Circle className="h-5 w-5 text-muted-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${completedTasks.includes(task.id) ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary font-medium">{task.xp || 25} XP</span>
                    <span className="text-[10px] text-muted-foreground">{task.milestone}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
