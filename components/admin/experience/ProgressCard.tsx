import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock } from 'lucide-react';
import { ExperienceSubmission, ExperienceBlogger, WORKFLOW_CONFIG } from '@/types/experience-blogger';
import { getWorkflowSteps, isStepRequired } from '@/lib/experience-deadline-utils';

interface ProgressCardProps {
  submission: ExperienceSubmission;
  bloggers: ExperienceBlogger[];
  progressPercentage: number;
}

export function ProgressCard({ submission, bloggers, progressPercentage }: ProgressCardProps) {
  const experienceType = submission.experience_type;
  const config = WORKFLOW_CONFIG[experienceType];
  const steps = getWorkflowSteps(experienceType);

  // Define step display information
  const stepInfo: Record<string, { label: string; isCompleted: boolean }> = {
    register: {
      label: '1. 블로거 등록',
      isCompleted: submission.bloggers_registered,
    },
    selection: {
      label: '2. 고객 선택',
      isCompleted: submission.bloggers_selected,
    },
    schedule: {
      label: config?.hasSelection ? '3. 일정 등록' : '2. 일정 등록',
      isCompleted: submission.schedule_confirmed,
    },
    client_confirm: {
      label: config?.hasSelection ? '4. 고객 확인' : '3. 고객 확인',
      isCompleted: submission.client_confirmed,
    },
    publish: {
      label: config?.hasSelection && config?.hasClientConfirm ? '5. 발행 완료' :
             config?.hasSelection || config?.hasClientConfirm ? '4. 발행 완료' : '3. 발행 완료',
      isCompleted: submission.all_published,
    },
    keyword_ranking: {
      label: '6. 키워드 순위',
      isCompleted: bloggers.some((b) => b.keyword_rankings && b.keyword_rankings.length > 0),
    },
    complete: {
      label: '7. 캠페인 완료',
      isCompleted: submission.campaign_completed,
    },
  };

  // Calculate dynamic step numbers
  let stepNumber = 1;
  const displaySteps = steps.map((step) => {
    const info = stepInfo[step];
    const currentStepNumber = step === 'complete' ? steps.length : stepNumber;
    if (step !== 'complete') stepNumber++;

    return {
      ...info,
      number: currentStepNumber,
      label: info.label.replace(/^\d+\./, `${currentStepNumber}.`),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>캠페인 진행 현황</CardTitle>
        <CardDescription>{steps.length}단계 워크플로우 진행률: {progressPercentage}%</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-violet-600 h-3 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {displaySteps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                {step.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

