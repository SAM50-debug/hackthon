export default function ExerciseSelector({ selected, onSelect }) {
  const exercises = ["Squat", "Shoulder Raise"];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Select Exercise
      </h3>

      <div className="flex gap-4">
        {exercises.map((exercise) => (
          <button
            key={exercise}
            onClick={() => onSelect(exercise)}
            className={`px-5 py-2 rounded-lg border transition ${
              selected === exercise
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {exercise}
          </button>
        ))}
      </div>
    </div>
  );
}
