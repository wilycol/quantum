import React from 'react';
import ErrorBoundary from './ErrorBoundary';

export function withBoundary<T>(label: string, Cmp: React.ComponentType<T>) {
  return function Wrapped(props: T) {
    return (
      <ErrorBoundary label={label}>
        <Cmp {...props} />
      </ErrorBoundary>
    );
  };
}
