import { Component, type ReactNode } from 'react';
import { Alert, Stack, Button, Text, Code } from '@mantine/core';

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

  render() {
    if (this.state.hasError) {
      return (
        <Stack p="xl" align="center" mt="xl">
          <Alert title="Something went wrong" color="red" variant="light" maw={600}>
            <Text size="sm" mb="sm">
              An unexpected error occurred. Try refreshing the page.
            </Text>
            {this.state.error && (
              <Code block>{this.state.error.message}</Code>
            )}
          </Alert>
          <Button
            variant="light"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Stack>
      );
    }
    return this.props.children;
  }
}
