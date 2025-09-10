
import React from 'react';

interface TextAreaInputProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}

export const TextAreaInput: React.FC<TextAreaInputProps> = ({ id, name, label, value, placeholder, onChange, rows = 5 }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-lg font-semibold text-gray-700">
        {label}
      </label>
      <div className="mt-2">
        <textarea
          id={id}
          name={name || id}
          rows={rows}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 transition"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
};