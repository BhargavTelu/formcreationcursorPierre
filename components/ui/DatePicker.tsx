import React from 'react';

type DatePickerProps = {
  id: string;
  label?: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
};

export function DatePicker({ id, label, value, min, onChange }: DatePickerProps) {
  return (
    <div>
      {label ? <label htmlFor={id} className="label">{label}</label> : null}
      <input
        id={id}
        type="date"
        className="input w-56"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}


