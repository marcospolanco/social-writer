import React, { useMemo } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error('VITE_CONVEX_URL is not defined in environment variables');
}

const convex = new ConvexReactClient(convexUrl);

interface ConvexContextProviderProps {
  children: React.ReactNode;
}

export const ConvexContextProvider: React.FC<ConvexContextProviderProps> = ({ children }) => {
  const client = useMemo(() => convex, []);

  return (
    <ConvexProvider client={client}>
      {children}
    </ConvexProvider>
  );
};