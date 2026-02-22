export default function ExerciseSelector({ selected, onSelect }) {
  const exercises = ["Squat", "Shoulder Raise"];

  return (
    <div className="flex items-center gap-3 bg-sv-surface/80 backdrop-blur-sm p-1.5 rounded-full border border-sv-border shadow-sm">
      {exercises.map((exercise) => {
        const isActive = selected === exercise;
        return (
          <button
            key={exercise}
            onClick={() => onSelect(exercise)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
              isActive
                ? "bg-slate-800 text-white shadow-md"
                : "text-sv-muted hover:text-sv-text hover:bg-sv-bg"
            } focus:outline-none focus:ring-2 focus:ring-sv-border focus:ring-offset-1`}
          >
            {exercise}
          </button>
        );
      })}
    </div>
  );
}
