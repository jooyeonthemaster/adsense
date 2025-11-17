import { WORKFLOW_CONFIG, WorkflowStep } from '@/types/experience-blogger';

/**
 * 블로거 등록 마감일 정보
 */
export interface DeadlineInfo {
  deadline: Date;
  daysLeft: number;
  isOverdue: boolean;
  urgencyLevel: 'critical' | 'warning' | 'normal';
}

/**
 * 블로거 등록 마감일 계산 (접수일로부터 2주 후)
 */
export const calculateBloggerRegistrationDeadline = (
  createdAt: string | null
): DeadlineInfo | null => {
  if (!createdAt) return null;

  const createdAtDate = new Date(createdAt);
  const deadline = new Date(createdAtDate);
  deadline.setDate(deadline.getDate() + 14); // 2주 후

  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    deadline,
    daysLeft: diffDays,
    isOverdue: diffDays < 0,
    urgencyLevel: diffDays <= 2 ? 'critical' : diffDays <= 6 ? 'warning' : 'normal',
  };
};

/**
 * 체험단 타입에 따른 워크플로우 단계 목록 반환
 */
export const getWorkflowSteps = (experienceType: string): WorkflowStep[] => {
  const config = WORKFLOW_CONFIG[experienceType];
  if (!config) {
    console.error(`Unknown experience type: ${experienceType}`);
    return ['register', 'schedule', 'publish', 'complete'];
  }

  const steps: WorkflowStep[] = ['register'];

  if (config.hasSelection) {
    steps.push('selection');
  }

  steps.push('schedule');

  if (config.hasClientConfirm) {
    steps.push('client_confirm');
  }

  steps.push('publish');

  if (config.hasKeywordRanking) {
    steps.push('keyword_ranking');
  }

  steps.push('complete');

  return steps;
};

/**
 * 특정 단계가 해당 체험단 타입에서 필요한지 확인
 */
export const isStepRequired = (
  experienceType: string,
  step: WorkflowStep
): boolean => {
  const config = WORKFLOW_CONFIG[experienceType];
  if (!config) return false;

  switch (step) {
    case 'register':
    case 'schedule':
    case 'publish':
    case 'complete':
      return true; // 모든 타입에 공통

    case 'selection':
      return config.hasSelection;

    case 'client_confirm':
      return config.hasClientConfirm;

    case 'keyword_ranking':
      return config.hasKeywordRanking;

    default:
      return false;
  }
};

/**
 * 체험단 타입에 따른 최대 팀 수 반환
 */
export const getMaxTeams = (experienceType: string): number | undefined => {
  const config = WORKFLOW_CONFIG[experienceType];
  return config?.maxTeams;
};

/**
 * 체험단 타입에 따라 등록 시 일정 입력이 필요한지 확인
 */
export const isScheduleRequiredAtRegistration = (experienceType: string): boolean => {
  const config = WORKFLOW_CONFIG[experienceType];
  return config?.scheduleAtRegistration ?? false;
};

