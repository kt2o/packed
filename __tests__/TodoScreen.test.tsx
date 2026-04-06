import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TodoScreen from '../src/app/(protected)/(tabs)/todo';

const mockUser = { id: 'test-user' };

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({
    user: mockUser,
  }),
}));

jest.mock('../src/lib/supabase-client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [],
            error: null,
          }),
      }),
    }),
  },
}));

test('renders header', async () => {
  const { getByText } = render(<TodoScreen />);

  await waitFor(() => {
    expect(getByText('My To-Do List')).toBeTruthy();
  });
});

test('shows empty state when there are no todos', async () => {
  const { getByText } = render(<TodoScreen />);

  await waitFor(() => {
    expect(getByText("No To-Do's yet.")).toBeTruthy();
  });
});