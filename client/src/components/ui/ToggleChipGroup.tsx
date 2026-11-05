interface ToggleChipOption<T extends string> {
  id: T;
  label: string;
}

interface ToggleChipGroupProps<T extends string> {
  legend: string;
  options: readonly ToggleChipOption<T>[];
  selected: readonly T[];
  onChange: (selected: T[]) => void;
  error?: string;
}

/** Multi-select as tappable chips. Each chip is a real checkbox for keyboard and screen readers. */
export function ToggleChipGroup<T extends string>({
  legend,
  options,
  selected,
  onChange,
  error,
}: ToggleChipGroupProps<T>) {
  const errorId = error ? `${legend.replace(/\s+/g, '-').toLowerCase()}-error` : undefined;

  function toggle(id: T) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  return (
    <fieldset aria-describedby={errorId}>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-leaf-400 ${
                isSelected
                  ? 'border-leaf-700 bg-leaf-700 text-wheat-50'
                  : 'border-soil-200 bg-white text-soil-800 hover:bg-wheat-100'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={isSelected}
                onChange={() => toggle(option.id)}
              />
              <span aria-hidden="true">{isSelected ? '✓' : '+'}</span>
              {option.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
