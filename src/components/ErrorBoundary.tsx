import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-surface-light p-6 dark:bg-surface-dark">
          <Text className="mb-2 text-2xl font-bold text-text-light dark:text-text-dark">
            Oops!
          </Text>
          <Text className="mb-6 text-center text-text-light/70 dark:text-text-dark/70">
            Une erreur inattendue s'est produite.
          </Text>
          {__DEV__ && this.state.error && (
            <Text className="mb-4 text-xs text-danger">{this.state.error.message}</Text>
          )}
          <TouchableOpacity
            onPress={this.handleReset}
            className="rounded-lg bg-primary px-6 py-3"
          >
            <Text className="font-semibold text-white">Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
