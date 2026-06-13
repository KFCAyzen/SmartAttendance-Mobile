/* useFeedback.ts — hook returning the same singleton API (ergonomic inside components). */

import { feedback, type Feedback } from './feedbackBus';

export function useFeedback(): Feedback {
  return feedback;
}
