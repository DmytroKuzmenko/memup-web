export interface SurveyQuestionDefinition {
  id: string;
  type: 'single-choice' | 'scale' | 'short-text';
  text: string;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
}

export interface SurveyDefinition {
  surveyId: string;
  title: string;
  isHidden?: boolean;
  questions: SurveyQuestionDefinition[];
}

export interface SurveyResponsePayload {
  surveyId: string;
  answers: { questionId: string; answer: string | number }[];
}

export interface SurveyListItem {
  surveyId: string;
  title: string;
  isHidden?: boolean;
}
