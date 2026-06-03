import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  /** Override des classes du contenu (padding/gap). */
  contentClassName?: string;
}

const DEFAULT_CONTENT = 'flex-grow px-5 pt-2 pb-7 gap-3.5';

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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
