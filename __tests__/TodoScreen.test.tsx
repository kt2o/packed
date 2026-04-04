import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

const mockUser = { id: 'test-user' };
const mockFrom = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({
    user: mockUser,
  }),
}));

jest.mock('../src/lib/supabase-client', () => ({
  __esModule: true,
  supabase: {
    from: mockFrom,
  },
}));

const mockScheduleNotificationAsync = jest.fn();
const mockCancelAllScheduledNotificationsAsync = jest.fn();
const mockGetPermissionsAsync = jest.fn(async () => ({ status: 'granted' }));
const mockRequestPermissionsAsync = jest.fn(async () => ({ status: 'granted' }));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelAllScheduledNotificationsAsync: mockCancelAllScheduledNotificationsAsync,
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');

  return function MockDateTimePicker(props: any) {
    return (
      <TouchableOpacity
        onPress={() =>
          props.onChange?.(
            { type: 'set' },
            new Date('2026-04-20T00:00:00.000Z')
          )
        }
      >
        <Text>Mock Date Picker</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('../src/components/PomodoroTimer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockPomodoroTimer() {
    return <Text>Pomodoro Timer Mock</Text>;
  };
});

type Todo = {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  deadline_at: string | null;
};

let mockTodos: Todo[] = [];

function setupSupabaseMock() {
  mockFrom.mockImplementation((table: string) => {
    if (table !== 'todo_list') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: jest.fn((_columns?: string) => ({
        eq: jest.fn(async (column: keyof Todo, value: string) => ({
          data: mockTodos.filter((todo) => String(todo[column]) === value),
          error: null,
        })),
      })),

      insert: jest.fn((rows: Partial<Todo>[]) => ({
        select: jest.fn(() => ({
          single: jest.fn(async () => {
            const newTodo: Todo = {
              id: `todo-${Date.now()}`,
              user_id: rows[0].user_id as string,
              title: rows[0].title as string,
              is_completed: Boolean(rows[0].is_completed),
              created_at: new Date().toISOString(),
              deadline_at: (rows[0].deadline_at as string | null) ?? null,
            };

            mockTodos.push(newTodo);
            return { data: newTodo, error: null };
          }),
        })),
      })),

      update: jest.fn((updates: Partial<Todo>) => ({
        eq: jest.fn((column: keyof Todo, value: string) => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => {
              const index = mockTodos.findIndex(
                (todo) => String(todo[column]) === value
              );

              if (index === -1) {
                return { data: null, error: { message: 'Todo not found' } };
              }

              mockTodos[index] = {
                ...mockTodos[index],
                ...updates,
              };

              return { data: mockTodos[index], error: null };
            }),
          })),
        })),
      })),

      delete: jest.fn(() => ({
        eq: jest.fn(async (column: keyof Todo, value: string) => {
          mockTodos = mockTodos.filter(
            (todo) => String(todo[column]) !== value
          );
          return { error: null };
        }),
      })),
    };
  });
}

const TodoScreen = require('../src/app/(protected)/(tabs)/todo').default;

describe('TodoScreen Test Class', () => {
  beforeEach(() => {
    mockTodos = [];
    jest.clearAllMocks();
    setupSupabaseMock();
  });

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

  // TDTC-1
  test('TDTC-1: Add new task', async () => {
    const { getByText, getByPlaceholderText } = render(<TodoScreen />);

    fireEvent.press(getByText('Add New Task'));
    fireEvent.changeText(getByPlaceholderText('Enter a task'), 'Task 1');
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(getByText(/Task 1/)).toBeTruthy();
    });
  });

  // TDTC-2
  test('TDTC-2: Add task with deadline', async () => {
    const { getByText, getByPlaceholderText } = render(<TodoScreen />);

    fireEvent.press(getByText('Add New Task'));
    fireEvent.changeText(getByPlaceholderText('Enter a task'), 'Deadline Task');
    fireEvent.press(getByText('Select Deadline'));
    fireEvent.press(getByText('Mock Date Picker'));
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(getByText(/Deadline Task/)).toBeTruthy();
      expect(getByText(/Due:/)).toBeTruthy();
    });
  });

  // TDTC-3
  test('TDTC-3: Prevent empty task', async () => {
    const { getByText, queryByText } = render(<TodoScreen />);

    fireEvent.press(getByText('Add New Task'));
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(queryByText("No To-Do's yet.")).toBeTruthy();
    });
  });

  // TDTC-4
  test('TDTC-4: Mark task as complete', async () => {
    mockTodos = [
      {
        id: '1',
        user_id: mockUser.id,
        title: 'Complete Me',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: null,
      },
    ];
    setupSupabaseMock();

    const { getByText } = render(<TodoScreen />);

    await waitFor(() => {
      expect(getByText(/Complete Me/)).toBeTruthy();
    });

    fireEvent.press(getByText(/Complete Me/));

    await waitFor(() => {
      expect(getByText(/✅ Complete Me/)).toBeTruthy();
    });
  });

  // TDTC-5
  test('TDTC-5: Edit task', async () => {
    mockTodos = [
      {
        id: '2',
        user_id: mockUser.id,
        title: 'Old',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: null,
      },
    ];
    setupSupabaseMock();

    const { getByText, getByDisplayValue } = render(<TodoScreen />);

    await waitFor(() => {
      expect(getByText(/Old/)).toBeTruthy();
    });

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Old'), 'Updated');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(getByText(/Updated/)).toBeTruthy();
    });
  });

  // TDTC-6
  test('TDTC-6: Delete task', async () => {
    mockTodos = [
      {
        id: '3',
        user_id: mockUser.id,
        title: 'Delete Me',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: null,
      },
    ];
    setupSupabaseMock();

    const { getByText, queryByText } = render(<TodoScreen />);

    await waitFor(() => {
      expect(getByText(/Delete Me/)).toBeTruthy();
    });

    fireEvent.press(getByText('Delete'));

    await waitFor(() => {
      expect(queryByText(/Delete Me/)).toBeNull();
    });
  });

  // TDTC-7
  test('TDTC-7: Filter active tasks', async () => {
    mockTodos = [
      {
        id: '1',
        user_id: mockUser.id,
        title: 'Alpha Active Task',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: null,
      },
      {
        id: '2',
        user_id: mockUser.id,
        title: 'Beta Completed Task',
        is_completed: true,
        created_at: new Date().toISOString(),
        deadline_at: null,
      },
    ];
    setupSupabaseMock();

    const { getByText, queryByText } = render(<TodoScreen />);

    await waitFor(() => {
      expect(getByText(/Alpha Active Task/)).toBeTruthy();
      expect(getByText(/Beta Completed Task/)).toBeTruthy();
    });

    fireEvent.press(getByText('Active'));

    await waitFor(() => {
      expect(getByText(/Alpha Active Task/)).toBeTruthy();
      expect(queryByText(/Beta Completed Task/)).toBeNull();
    });
  });

  // TDTC-8
  test('TDTC-8: Filter completed tasks', async () => {
    mockTodos = [
      {
        id: '1',
        user_id: mockUser.id,
        title: 'Alpha Active Task',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: null,
      },
      {
        id: '2',
        user_id: mockUser.id,
        title: 'Beta Completed Task',
        is_completed: true,
        created_at: new Date().toISOString(),
        deadline_at: null,
      },
    ];
    setupSupabaseMock();

    const { getByText, queryByText } = render(<TodoScreen />);

    await waitFor(() => {
      expect(getByText(/Alpha Active Task/)).toBeTruthy();
      expect(getByText(/Beta Completed Task/)).toBeTruthy();
    });

    fireEvent.press(getByText('Completed'));

    await waitFor(() => {
      expect(getByText(/Beta Completed Task/)).toBeTruthy();
      expect(queryByText(/Alpha Active Task/)).toBeNull();
    });
  });

  // TDTC-9
  test('TDTC-9: Sort by deadline', async () => {
    mockTodos = [
      {
        id: '1',
        user_id: mockUser.id,
        title: 'Later',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: '2026-05-01T00:00:00.000Z',
      },
      {
        id: '2',
        user_id: mockUser.id,
        title: 'Soon',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: '2026-04-01T00:00:00.000Z',
      },
    ];
    setupSupabaseMock();

    const { getAllByText } = render(<TodoScreen />);

    await waitFor(() => {
      const matches = getAllByText(/Soon|Later/);
      const renderedText = matches.map((node) => {
        const children = node.props.children;
        return Array.isArray(children) ? children.join('') : String(children);
      });

      expect(renderedText[0]).toContain('Soon');
      expect(renderedText[1]).toContain('Later');
    });
  });

  // TDTC-10
  test('TDTC-10: Deadline notification scheduled', async () => {
    const { getByText, getByPlaceholderText } = render(<TodoScreen />);

    fireEvent.press(getByText('Add New Task'));
    fireEvent.changeText(getByPlaceholderText('Enter a task'), 'Notify Task');
    fireEvent.press(getByText('Select Deadline'));
    fireEvent.press(getByText('Mock Date Picker'));
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(mockScheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  // TDTC-11
  test('TDTC-11: Overdue task detection', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    mockTodos = [
      {
        id: '1',
        user_id: mockUser.id,
        title: 'Overdue Task',
        is_completed: false,
        created_at: new Date().toISOString(),
        deadline_at: pastDate,
      },
    ];
    setupSupabaseMock();

    const { getByText } = render(<TodoScreen />);

    await waitFor(() => {
      expect(getByText(/Overdue Task/)).toBeTruthy(); // FIXED
      expect(getByText(/^Overdue$/)).toBeTruthy();
    });
  });
});