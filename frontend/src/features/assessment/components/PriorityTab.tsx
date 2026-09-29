import { motion } from "framer-motion";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trophy } from "lucide-react";

const VALUE_ITEMS = [
  { id: "salary", label: "💰 High Salary", desc: "Earning potential matters most" },
  { id: "security", label: "🎯 Job Security", desc: "Stable, long-term employment" },
  { id: "impact", label: "🌍 Social Impact", desc: "Making a difference in society" },
  { id: "creative", label: "🎨 Creative Freedom", desc: "Express yourself through work" },
  { id: "balance", label: "⏰ Work-Life Balance", desc: "Time for personal life" },
  { id: "prestige", label: "🏆 Status & Prestige", desc: "Recognition and respect" },
];

function SortableItem({ id, label, desc, index }: { id: string; label: string; desc: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const points = [30, 20, 15, 10, 5, 0][index];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`mb-2.5 flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
          : index === 0
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-card hover:border-border-hover"
      }`}
    >
      <button {...listeners} className="cursor-grab text-muted-foreground active:cursor-grabbing hover:text-foreground transition-colors">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold">
        {index < 3 ? medals[index] : <span className="text-xs text-muted-foreground">{index + 1}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        index === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        {points}pts
      </span>
    </motion.div>
  );
}

interface Props {
  priorities: string[];
  setPriorities: (fn: (prev: string[]) => string[]) => void;
}

export default function PriorityTab({ priorities, setPriorities }: Props) {
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPriorities(prev => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-center">
        <Trophy className="inline h-5 w-5 text-primary mb-1" />
        <p className="text-sm font-medium text-foreground">Rank Your Career Values</p>
        <p className="text-xs text-muted-foreground mt-1">Drag to reorder — top = highest priority</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={priorities} strategy={verticalListSortingStrategy}>
          {priorities.map((id, i) => {
            const item = VALUE_ITEMS.find(v => v.id === id)!;
            return <SortableItem key={id} id={id} label={item.label} desc={item.desc} index={i} />;
          })}
        </SortableContext>
      </DndContext>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Your #1 priority strongly influences career matching
      </p>
    </div>
  );
}

export { VALUE_ITEMS };
