'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface CheckboxRadioItemProps {
  value: string;
  id: string;
  label: string;
  className?: string;
}

const CheckboxRadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export function CheckboxRadioGroup({
  value,
  onValueChange,
  className,
  children,
}: CheckboxRadioGroupProps) {
  return (
    <CheckboxRadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn('space-y-2.5', className)}>{children}</div>
    </CheckboxRadioGroupContext.Provider>
  );
}

export function CheckboxRadioItem({
  value,
  id,
  label,
  className,
}: CheckboxRadioItemProps) {
  const context = React.useContext(CheckboxRadioGroupContext);

  if (!context) {
    throw new Error('CheckboxRadioItem must be used within CheckboxRadioGroup');
  }

  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;

  return (
    <div className={cn('flex items-center gap-3 group', className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        id={id}
        onClick={() => onValueChange(value)}
        className={cn(
          'relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isSelected
            ? 'bg-sky-500 border-sky-500 shadow-lg scale-100'
            : 'border-gray-300 bg-white hover:border-sky-400 hover:bg-sky-50 hover:scale-105'
        )}
      >
        <Check
          className={cn(
            'h-4 w-4 text-white',
            isSelected
              ? 'animate-bounce-in'
              : 'scale-0 opacity-0'
          )}
          strokeWidth={3}
        />
      </button>
      <label
        htmlFor={id}
        className={cn(
          'text-sm font-medium cursor-pointer select-none transition-colors',
          isSelected ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-800'
        )}
      >
        {label}
      </label>
    </div>
  );
}
