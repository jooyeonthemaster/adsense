import { BloggerSchedule } from '@/types/experience-blogger';

/**
 * 요일 문자열을 요일 인덱스로 매핑
 */
const DAY_MAP: Record<string, number> = {
  '일': 0,
  '월': 1,
  '화': 2,
  '수': 3,
  '목': 4,
  '금': 5,
  '토': 6,
};

/**
 * 특정 기간 내 가능한 날짜 목록 생성
 */
export const getAvailableDates = (
  startDate: Date,
  endDate: Date,
  availableDays: string[]
): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayIndex = current.getDay();
    const dayName = Object.keys(DAY_MAP).find((key) => DAY_MAP[key] === dayIndex);
    if (dayName && availableDays.includes(dayName)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

/**
 * 시간 슬롯 생성
 */
export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  intervalMinutes: number = 60
): string[] => {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let current = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;

  while (current <= end - intervalMinutes) {
    const hours = Math.floor(current / 60);
    const mins = current % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    current += intervalMinutes;
  }
  return slots;
};

/**
 * 랜덤 배정
 */
export const autoAssignRandom = (
  schedules: BloggerSchedule[],
  availableDays: string[],
  startTime: string,
  endTime: string
): BloggerSchedule[] => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const availableDates = getAvailableDates(startDate, endDate, availableDays);
  const timeSlots = generateTimeSlots(startTime, endTime);

  console.log('[autoAssignRandom] Available dates:', availableDates.length);
  console.log('[autoAssignRandom] Time slots:', timeSlots.length);

  if (availableDates.length === 0) {
    throw new Error('선택된 요일에 해당하는 날짜가 없습니다.');
  }

  if (timeSlots.length === 0) {
    throw new Error('시간대를 생성할 수 없습니다.');
  }

  return schedules.map((schedule) => ({
    ...schedule,
    visit_date: availableDates[Math.floor(Math.random() * availableDates.length)]
      .toISOString()
      .split('T')[0],
    visit_time: timeSlots[Math.floor(Math.random() * timeSlots.length)],
    visit_count: 1,
  }));
};

/**
 * 분산 배정
 */
export const autoAssignDistributed = (
  schedules: BloggerSchedule[],
  availableDays: string[],
  startTime: string,
  endTime: string
): BloggerSchedule[] => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const availableDates = getAvailableDates(startDate, endDate, availableDays);
  const timeSlots = generateTimeSlots(startTime, endTime, 30);

  if (availableDates.length === 0) {
    throw new Error('선택된 요일에 해당하는 날짜가 없습니다.');
  }

  if (timeSlots.length === 0) {
    throw new Error('시간대를 생성할 수 없습니다.');
  }

  return schedules.map((schedule, index) => {
    const dateIndex = Math.floor((index / schedules.length) * availableDates.length);
    const timeIndex = index % timeSlots.length;

    return {
      ...schedule,
      visit_date: availableDates[dateIndex].toISOString().split('T')[0],
      visit_time: timeSlots[timeIndex],
      visit_count: 1,
    };
  });
};

/**
 * 빠른 배정 (2주 이내)
 */
export const autoAssignEarliest = (
  schedules: BloggerSchedule[],
  availableDays: string[],
  startTime: string,
  endTime: string
): BloggerSchedule[] => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);

  const availableDates = getAvailableDates(startDate, endDate, availableDays);
  const timeSlots = generateTimeSlots(startTime, endTime, 30);

  if (availableDates.length === 0) {
    throw new Error('2주 이내에 선택된 요일에 해당하는 날짜가 없습니다.');
  }

  if (timeSlots.length === 0) {
    throw new Error('시간대를 생성할 수 없습니다.');
  }

  return schedules.map((schedule, index) => {
    const dateIndex = Math.floor(index / timeSlots.length);
    const timeIndex = index % timeSlots.length;

    return {
      ...schedule,
      visit_date: availableDates[Math.min(dateIndex, availableDates.length - 1)]
        .toISOString()
        .split('T')[0],
      visit_time: timeSlots[timeIndex],
      visit_count: 1,
    };
  });
};

/**
 * 균일 배정 (30일 기간 균등 분배)
 */
export const autoAssignEvenly = (
  schedules: BloggerSchedule[],
  availableDays: string[],
  startTime: string,
  endTime: string
): BloggerSchedule[] => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const availableDates = getAvailableDates(startDate, endDate, availableDays);
  const interval = Math.floor(availableDates.length / schedules.length);
  const timeSlots = generateTimeSlots(startTime, endTime, 60);

  if (availableDates.length === 0) {
    throw new Error('선택된 요일에 해당하는 날짜가 없습니다.');
  }

  if (timeSlots.length === 0) {
    throw new Error('시간대를 생성할 수 없습니다.');
  }

  return schedules.map((schedule, index) => ({
    ...schedule,
    visit_date: availableDates[Math.min(index * interval, availableDates.length - 1)]
      .toISOString()
      .split('T')[0],
    visit_time: timeSlots[index % timeSlots.length],
    visit_count: 1,
  }));
};

/**
 * 특정 시간대로 배정
 */
export const autoAssignSpecificTime = (
  schedules: BloggerSchedule[],
  availableDays: string[],
  targetTime: string
): BloggerSchedule[] => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const availableDates = getAvailableDates(startDate, endDate, availableDays);

  if (availableDates.length === 0) {
    throw new Error('선택된 요일에 해당하는 날짜가 없습니다.');
  }

  return schedules.map((schedule, index) => ({
    ...schedule,
    visit_date: availableDates[Math.floor((index / schedules.length) * availableDates.length)]
      .toISOString()
      .split('T')[0],
    visit_time: targetTime,
    visit_count: 1,
  }));
};

