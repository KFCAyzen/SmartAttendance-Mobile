/* types.ts — feedback system contracts */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  /** visual type → status icon + color. Default: 'info' */
  type?: ToastType;
  /** main line (≈ ex-`text1`) */
  title: string;
  /** optional second line (≈ ex-`text2`) — kept short */
  message?: string;
  /** auto-dismiss in ms. Default 2800. Pass 0 to keep until dismissed. */
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
}

export interface UndoOptions {
  /** message line, e.g. "Demande rejetée" */
  title: string;
  /** action button label. Default "Annuler" */
  actionLabel?: string;
  /** called when the user taps the action */
  onUndo?: () => void;
  /** auto-dismiss in ms. Default 5000. */
  duration?: number;
}

export interface SnackItem extends UndoOptions {
  id: number;
}
