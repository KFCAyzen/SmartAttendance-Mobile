/* FeedbackProvider.tsx — mounts the overlay (one pill + one snackbar at a time)
   and wires the imperative bus. Render once, high in the tree (see _layout.tsx). */

import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSnackbar } from './BottomSnackbar';
import { TopPill } from './TopPill';
import { _register } from './feedbackBus';
import type { SnackItem, ToastItem, ToastOptions, UndoOptions } from './types';

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [pill, setPill] = useState<ToastItem | null>(null);
  const [snack, setSnack] = useState<SnackItem | null>(null);
  const counter = useRef(0);

  const handlers = useMemo(
    () => ({
      toast: (o: ToastOptions) => setPill({ id: ++counter.current, type: 'info', ...o }),
      undo: (o: UndoOptions) => setSnack({ id: ++counter.current, ...o }),
      dismiss: () => {
        setPill(null);
        setSnack(null);
      },
    }),
    [],
  );

  useEffect(() => _register(handlers), [handlers]);

  return (
    <>
      {children}
      {/* Overlay sits above everything; box-none lets touches fall through except on the surfaces. */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {pill && (
          <TopPill
            key={pill.id}
            item={pill}
            topInset={insets.top}
            onClose={(id) => setPill((p) => (p?.id === id ? null : p))}
          />
        )}
        {snack && (
          <BottomSnackbar
            key={snack.id}
            item={snack}
            bottomInset={insets.bottom}
            onClose={(id) => setSnack((s) => (s?.id === id ? null : s))}
          />
        )}
      </View>
    </>
  );
}
