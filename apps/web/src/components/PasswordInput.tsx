'use client';

import React from 'react';

interface PasswordInputProps {
  id: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  className?: string;
}

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  minLength,
  autoComplete,
  className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
}: PasswordInputProps) {
  return (
    <input
      id={id}
      name={name || id}
      type="password"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      autoComplete={autoComplete}
      className={className}
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '16px',
        letterSpacing: '0.2em',
      } as React.CSSProperties}
    />
  );
}
