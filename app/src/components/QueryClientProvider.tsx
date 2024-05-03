import React from 'react';
import { Button } from '@mui/joy';
import { QueryClient, QueryClientProvider as _QueryClientProvider, useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ErrorBoundary } from 'react-error-boundary';

const QueryClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = new QueryClient();
  const { reset } = useQueryErrorResetBoundary();

  // Error logging function
  function logErrorToService(error: Error, info: React.ErrorInfo) {
    // Use your preferred error logging service
    console.error("Caught an error:", error, info);
  }

  return (
    <_QueryClientProvider client={queryClient}>
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ resetErrorBoundary, error }) => (
          <div >
            There was an error!
            <pre style={{ whiteSpace: 'normal' }}>{error.message}</pre>
            <Button onClick={() => resetErrorBoundary()}>Try again</Button>
          </div>
        )}
        onError={logErrorToService}
      >
        <ReactQueryDevtools />
        {children}
      </ErrorBoundary>
    </_QueryClientProvider>
  );
};

export default QueryClientProvider;