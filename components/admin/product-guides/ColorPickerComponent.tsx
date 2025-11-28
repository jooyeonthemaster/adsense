'use client';

import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ColorPreset {
  name: string;
  bg: string;
  text: string;
  preview: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: '기본', bg: '', text: '', preview: 'bg-white border-2' },
  { name: '하늘색', bg: 'bg-sky-50', text: 'text-sky-900', preview: 'bg-sky-50 border-sky-200' },
  { name: '파란색', bg: 'bg-blue-50', text: 'text-blue-900', preview: 'bg-blue-50 border-blue-200' },
  { name: '보라색', bg: 'bg-purple-50', text: 'text-purple-900', preview: 'bg-purple-50 border-purple-200' },
  { name: '초록색', bg: 'bg-green-50', text: 'text-green-900', preview: 'bg-green-50 border-green-200' },
  { name: '노란색', bg: 'bg-yellow-50', text: 'text-yellow-900', preview: 'bg-yellow-50 border-yellow-200' },
  { name: '주황색', bg: 'bg-orange-50', text: 'text-orange-900', preview: 'bg-orange-50 border-orange-200' },
  { name: '빨간색', bg: 'bg-red-50', text: 'text-red-900', preview: 'bg-red-50 border-red-200' },
  { name: '회색', bg: 'bg-gray-50', text: 'text-gray-900', preview: 'bg-gray-50 border-gray-200' },
];

interface ColorPickerComponentProps {
  bgColor: string;
  textColor: string;
  onChange: (bgColor: string, textColor: string) => void;
}

export function ColorPickerComponent({ bgColor, textColor, onChange }: ColorPickerComponentProps) {
  return (
    <div>
      <Label className="mb-3 block">배경색 선택</Label>
      <div className="grid grid-cols-3 gap-3">
        {COLOR_PRESETS.map((preset) => {
          const isSelected = preset.bg === bgColor && preset.text === textColor;
          
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.bg, preset.text)}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all hover:scale-105',
                preset.preview,
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              )}
            >
              <div className="flex flex-col items-center gap-2">
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                <div className={cn('w-full h-12 rounded', preset.preview)}></div>
                <span className="text-xs font-medium">{preset.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}




