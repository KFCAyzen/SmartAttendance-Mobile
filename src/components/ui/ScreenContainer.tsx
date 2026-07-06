import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  /** Override des classes du contenu (padding/gap). */
  contentClassName?: string;
}

const DEFAULT_CONTENT = 'flex-grow px-5 pt-4 pb-7 gap-3.5';

export function ScreenContainer({
  children,
  scrollable = true,
  contentClassName = DEFAULT_CONTENT,
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-surface-light dark:bg-surface-dark"
    >
      {/* `padding` aussi sur Android : avec edge-to-edge la fenêtre n'est plus
          redimensionnée par le clavier (adjustResize inopérant), il faut donc
          compenser en JS sur les deux plateformes. */}
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        {scrollable ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={contentClassName}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
