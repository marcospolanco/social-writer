export interface RubricGrade {
  score: string; // A, B, C, D, F
  points: number; // out of 100
  comments: string[];
  suggestions: string[];
}

export interface PostFeedback {
  overall_score: string;
  overall_points: number;
  hook_quality: RubricGrade;
  story_structure: RubricGrade;
  scannability: RubricGrade;
  takeaway_cta: RubricGrade;
  authenticity: RubricGrade;
  general_feedback: string[];
}