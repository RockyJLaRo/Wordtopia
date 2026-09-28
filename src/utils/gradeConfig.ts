import { GradeLevel } from '../types';

export interface GradeConfig {
  answerChoices: number;
  hasTimer: boolean;
  timerSeconds: number;
  hintsAllowed: number;
  matchPairs: number;
}

export const getGradeConfig = (grade: GradeLevel): GradeConfig => {
  switch (grade) {
    case 'Kindergarten':
    case '1st Grade':
      return { answerChoices: 2, hasTimer: false, timerSeconds: 0, hintsAllowed: 99, matchPairs: 2 };
    case '2nd Grade':
    case '3rd Grade':
      return { answerChoices: 3, hasTimer: false, timerSeconds: 0, hintsAllowed: 2, matchPairs: 3 };
    case '4th Grade':
    case '5th Grade':
      return { answerChoices: 4, hasTimer: true, timerSeconds: 30, hintsAllowed: 1, matchPairs: 4 };
    case '6th Grade':
    case '7th Grade':
    case '8th Grade':
      return { answerChoices: 4, hasTimer: true, timerSeconds: 20, hintsAllowed: 1, matchPairs: 4 };
    case '9th Grade':
    case '10th Grade':
    case '11th Grade':
    case '12th Grade':
    case 'Custom':
      return { answerChoices: 4, hasTimer: true, timerSeconds: 15, hintsAllowed: 0, matchPairs: 5 };
    default:
      return { answerChoices: 4, hasTimer: false, timerSeconds: 0, hintsAllowed: 1, matchPairs: 4 };
  }
};
