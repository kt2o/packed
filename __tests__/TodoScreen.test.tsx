import React from 'react';
import { render } from '@testing-library/react-native';
import TodoScreen from '../src/app/(protected)/(tabs)/todo';

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({
    user: { id: 'test-user' },
  }),
}));

jest.mock('../src/lib/supabase-client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({
          data: [],
          error: null,
        }),
      }),
    }),
  },
}));

test('renders header', () => {
  const { getByText } = render(<TodoScreen />);
  expect(getByText('My To-Do List')).toBeTruthy();
});