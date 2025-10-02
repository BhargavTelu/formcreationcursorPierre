import React from 'react';

export type CheckboxOption = {
  id: string;
  value: string;
  label: React.ReactNode;
};

type CheckboxGroupProps = {
  name: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
};

export function CheckboxGroup({ name, options, values, onChange, className }: CheckboxGroupProps) {
  const toggle = (val: string) => {
    const set = new Set(values);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    onChange(Array.from(set));
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {options.map((opt) => (
          <div key={opt.id} className="relative">
            <input
              id={opt.id}
              name={name}
              type="checkbox"
              className="peer sr-only"
              checked={values.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            <label
              htmlFor={opt.id}
              className="block cursor-pointer rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2 text-center font-medium transition-colors peer-checked:border-sky-600 peer-checked:bg-sky-600 peer-checked:text-white hover:border-sky-600"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}


