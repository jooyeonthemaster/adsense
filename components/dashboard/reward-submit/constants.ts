import type { RewardFormData } from './types';

export const INITIAL_FORM_DATA: RewardFormData = {
  twopleSelected: true,
  businessName: '',
  placeUrl: '',
  placeMid: '',
  dailyVolume: 100,
  startDate: null,
  endDate: null,
};

export const MIN_DAILY_VOLUME = 100;
export const MIN_OPERATION_DAYS = 3;
export const MAX_OPERATION_DAYS = 7;
