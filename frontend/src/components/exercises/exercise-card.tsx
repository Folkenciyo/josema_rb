import { Badge } from "@/components/ui/badge";
import type { Exercise } from "@/types/exercise";
import { isCustomExercise } from "@/types/exercise";
import { ExerciseImage } from "./exercise-image";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onSelect }: ExerciseCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <ExerciseImage
        path={exercise.images[0]}
        alt={exercise.name_es}
        className="h-36 w-full"
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 font-semibold text-slate-800">
          {exercise.name_es}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {exercise.primary_muscles_es.slice(0, 2).map((muscle) => (
            <Badge key={muscle}>{muscle}</Badge>
          ))}
          {exercise.equipment_es && (
            <Badge className="bg-slate-50 text-slate-500">
              {exercise.equipment_es}
            </Badge>
          )}
          {isCustomExercise(exercise) && (
            <Badge className="bg-amber-100 text-amber-700">Propio</Badge>
          )}
        </div>
      </div>
    </button>
  );
}
