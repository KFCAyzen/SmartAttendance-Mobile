/* feedbackBus.ts — imperative singleton so you can trigger feedback from anywhere
   (API callbacks, hooks, stores) exactly like the old `Toast.show`, not just React components. */

import type { ToastOptions, UndoOptions } from './types';

type Handlers = {
  toast: (o: ToastOptions) => void;
  undo: (o: UndoOptions) => void;
  dismiss: () => void;
};

let H: Handlers | null = null;

/** Called by <FeedbackProvider> on mount. Returns an unsubscribe fn. */
export function _register(h: Handlers): () => void {
  H = h;
  return () => {
    if (H === h) H = null;
  };
}

function notMounted() {
  if (__DEV__) console.warn('[feedback] called before <FeedbackProvider> mounted — message dropped.');
}

/**
 * Global feedback API. Import and call from anywhere:
 *   import { feedback } from '~/components/feedback';
 *   feedback.success('Pointage enregistré');
 *   feedback.undo({ title: 'Demande rejetée', onUndo: () => restore() });
 */
export const feedback = {
  toast: (o: ToastOptions) => (H ? H.toast(o) : notMounted()),
  success: (title: string, message?: string) => feedback.toast({ type: 'success', title, message }),
  error: (title: string, message?: string) => feedback.toast({ type: 'error', title, message }),
  info: (title: string, message?: string) => feedback.toast({ type: 'info', title, message }),
  warning: (title: string, message?: string) => feedback.toast({ type: 'warning', title, message }),
  /** bottom snackbar with an "Annuler" action — for reversible actions (delete, reject…) */
  undo: (o: UndoOptions) => (H ? H.undo(o) : notMounted()),
  dismiss: () => H?.dismiss(),
};

export type Feedback = typeof feedback;
