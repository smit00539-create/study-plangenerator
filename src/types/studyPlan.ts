export interface Chapter {
  name: string;
  lectures_remaining: number;
  estimated_minutes?: number;
}

export interface Revision {
  name: string;
  stage?: number;
}

export interface CustomFactorItem {
  id: string;
  name: string;
  value: string;
}

export interface CustomFactorType {
  id: string;
  typeName: string;
  items: CustomFactorItem[];
  maxPerDay?: number;
}

export interface Subject {
  id: string;
  name: string;
  preference_weight: number;
  chapters: Chapter[];
  revisions: Revision[];
  customFactorTypes: CustomFactorType[];
  max_lectures_per_day?: number;
  max_revisions_per_day?: number;
}

export interface StudyPlan {
  exam_name?: string;
  start_date?: string;
  duration_days: number;
  max_lectures_per_day: number;
  subjects_per_day: number;
  rotation_enabled: boolean;
  revision_sundays_only: boolean;
  distribution_mode: "auto" | "preference";
  force_even_distribution?: boolean;
  preserve_chapter_atomicity?: boolean;
  allow_chapter_splitting?: boolean;
  pdf_theme: "simple" | "compact" | "colorful" | "print";
  description?: string;
  subjects: Subject[];
}

export interface DayPlan {
  day: number;
  date?: string;
  subjects: string[];
  lectures: { subject: string; chapter: string; count: number }[];
  revisions: { subject: string; revision: string }[];
  customFactors: { subject: string; factorType: string; factorName: string; value: string }[];
  practice_note?: string;
}

export interface GeneratedSchedule {
  days: DayPlan[];
  summary: {
    total_lectures: number;
    lectures_per_subject: Record<string, number>;
    completion_day: number;
    buffer_days: number;
  };
}