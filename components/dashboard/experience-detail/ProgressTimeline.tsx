'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock } from 'lucide-react';
import type { WorkflowStep, StepStatus } from './types';

interface ProgressTimelineProps {
  steps: WorkflowStep[];
  currentStep: number;
  getStepStatus: (stepNumber: number) => StepStatus;
}

export function ProgressTimeline({ steps, currentStep, getStepStatus }: ProgressTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>캠페인 진행 상황</CardTitle>
        <CardDescription>
          현재 {currentStep}/{steps.length} 단계 진행중
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress bar background */}
          <div
            className="absolute top-5 left-0 right-0 h-1 bg-gray-200 hidden md:block"
            style={{ left: '2.5rem', right: '2.5rem' }}
          />
          {/* Progress bar filled */}
          <div
            className="absolute top-5 left-0 h-1 bg-violet-500 hidden md:block transition-all duration-500"
            style={{
              left: '2.5rem',
              width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 2.5rem)`,
            }}
          />

          {/* Steps */}
          <div className="grid grid-cols-2 md:flex md:justify-between gap-4 md:gap-2 relative">
            {steps.map((step) => {
              const status = getStepStatus(step.number);
              return (
                <div key={step.number} className="flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 relative z-10 ${
                      status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : status === 'current' ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <span className="text-sm">{step.number}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Status badge */}
                  {status === 'completed' && (
                    <Badge variant="secondary" className="text-xs">
                      완료
                    </Badge>
                  )}
                  {status === 'current' && (
                    <Badge variant="default" className="text-xs">
                      진행중
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
