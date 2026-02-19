export default function ExerciseSelector({ selected, onSelect }) {
  const exercises = ["Squat", "Shoulder Raise"];

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-1.5 rounded-full border border-stone-200 shadow-sm">
      {exercises.map((exercise) => {
        const isActive = selected === exercise;
        return (
          <button
            key={exercise}
            onClick={() => onSelect(exercise)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
              isActive
                ? "bg-slate-800 text-white shadow-md"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            } focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-1`}
          >
            {exercise}
          </button>
        );
      })}
    </div>
  );
}
