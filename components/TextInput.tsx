import React from 'react';

interface TextInputProps {
  name: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number' | 'tel' | 'email';
  required?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  name,
  label,
  value,
  placeholder,
  onChange,
  type = 'text',
  required = false,
}) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 p-2.5 transition"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};