export type SlideType = 
  | 'intro' 
  | 'feature' 
  | 'step-by-step' 
  | 'comparison'
  | 'summary';

export interface Slide {
  id: number;
  type: SlideType;
  title: string;
  subtitle?: string;
  content: {
    main?: string;
    points?: string[];
    steps?: Array<{
      number: number;
      title: string;
      description: string;
      tip?: string;
    }>;
    image?: string;
    icon?: string;
    highlight?: string;
  };
  bgColor?: string;
}

export interface SlideSection {
  title: string;
  slides: Slide[];
}

