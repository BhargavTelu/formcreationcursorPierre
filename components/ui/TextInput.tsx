import React from 'react';

type TextInputProps = {
  id: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email';
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
};

export function TextInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required,
  min,
  max,
  className,
}: TextInputProps) {
  return (
    <div className={className}>
      {label ? <label htmlFor={id} className="label">{label}</label> : null}
      <input
        id={id}
        type={type}
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        max={max}
      />
    </div>
  );
}


