export interface RewardSubmitFormProps {
  initialPoints: number;
}

export interface RewardFormData {
  twopleSelected: boolean;
  businessName: string;
  placeUrl: string;
  placeMid: string;
  dailyVolume: number;
  startDate: Date | null;
  endDate: Date | null;
}
