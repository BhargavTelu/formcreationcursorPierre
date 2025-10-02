import React from 'react';

export type RadioOption = {
  id: string;
  value: string;
  label: React.ReactNode;
};

type RadioGroupProps = {
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
  itemClassName?: string;
};

export function RadioGroup({ name, options, value, onChange, className, itemClassName }: RadioGroupProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((opt) => (
          <div key={opt.id} className={itemClassName}>
            <input
              id={opt.id}
              name={name}
              type="radio"
              className="peer sr-only"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <label
              htmlFor={opt.id}
              className="block w-full h-full cursor-pointer rounded-md border-2 border-gray-200 bg-gray-50 px-4 py-3 text-center font-medium transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white hover:border-emerald-600"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}


