# Testing Guide

This document explains where the test files are located, what each test suite covers, how to run the tests, and the main limitations of the current test coverage.

## Test location

All test files should be placed in the project’s Jest test directory:

```text
__tests__/
```

The current test suite consists of these files:

```text
__tests__/Location.test.tsx
__tests__/Notifications.test.tsx
__tests__/PomodoroTimer.test.tsx
__tests__/ProfileFunctions.test.tsx
__tests__/SubmitStatus.test.tsx
__tests__/Cooldown.fuzz.test.tsx
__tests__/Pommodoro.fuzz.test.tsx
__tests__/RewardSystem.test.tsx
__tests__/TodoScreen.test.tsx
__tests__/Chat.test.tsx
```

> Note: `Pommodoro.fuzz.test.tsx` is intentionally listed with the filename currently provided. The file tests Pomodoro timer utility logic, but the filename contains an extra `m` in `Pommodoro`.

## What is covered

The tests focus on the Packed React Native / Expo application. Most tests are unit or component-level tests written with Jest and `@testing-library/react-native`. External services such as Supabase, Clerk, Expo Location, Expo Notifications, Expo Router, and some native UI modules are mocked so the tests can run without a real device, real account, or live backend.

### Location check-in tests

**File:** `__tests__/Location.test.tsx`

Covers the study spot location check-in flow for `SpotScreen`:

- Rendering the selected spot name and radius.
- Redirecting users to the location permission screen when foreground location permission is denied.
- Failing check-in when the mocked user location is outside the allowed radius.
- Inserting a check-in into the mocked Supabase client when location validation succeeds.
- Navigating to the submit screen with `verified=true` after a successful check-in.
- Handling Supabase insert errors by navigating to the submit screen with `verified=false`.

### Notification tests

**File:** `__tests__/Notifications.test.tsx`

Covers the notification helper functions and notification setup:

- Returning an Expo push token when permission is already granted.
- Requesting notification permission when permission is undetermined.
- Returning `null` when permission is denied.
- Handling permission API failures.
- Handling malformed push token responses.
- Handling Expo token retrieval errors.
- Verifying that the notification handler is registered.
- Verifying notification handler behavior.
- Verifying notification listener registration.
- Saving Expo push tokens to the mocked Supabase table `user_push_notifications`.
- Handling Supabase upsert errors, exceptions, missing tokens, and duplicate-token style cases.

### Pomodoro timer component tests

**File:** `__tests__/PomodoroTimer.test.tsx`

Covers the Pomodoro timer UI and selected side effects:

- Rendering the timer in `MM:SS` format.
- Formatting single-digit seconds with a leading zero.
- Showing `START` or `PAUSE` depending on the active state.
- Switching between Focus and Break modes.
- Calling `onToggle` when the start/pause button is pressed.
- Calling `onReset` when the reset button is pressed.
- Simulating notification scheduling for a focus session.
- Simulating vibration and completion alerts when a timer ends.
- Canceling scheduled notifications during reset-related logic.

### Profile and account action tests

**File:** `__tests__/ProfileFunctions.test.tsx`

Covers the profile screen and account-related interactions:

- Opening the edit profile modal.
- Updating the username through the mocked Clerk user object.
- Blocking usernames that are too short.
- Triggering the sign-out confirmation alert.
- Executing sign-out when the destructive confirmation action is selected.
- Loading reward points from the mocked Supabase `user_rewards` table.
- Handling errors when reward data fails to load.

### Submit status tests

**File:** `__tests__/SubmitStatus.test.tsx`

Covers status submission behavior on the submit screen:

- Showing an error when the user submits without selecting a location.
- Selecting a mocked study spot from the location dropdown.
- Rendering floor options for the selected study spot.
- Blocking or warning when the cooldown has not expired.
- Inserting submission data into the mocked Supabase client in successful paths.
- Using mocked router/search params so submit flow behavior can be tested without real Expo navigation.

### Cooldown fuzz tests

**File:** `__tests__/Cooldown.fuzz.test.tsx`

Covers the `canCheckIn()` utility using randomized date inputs:

- Verifies that random timestamps do not cause crashes.
- Verifies that the function always returns a boolean.
- Uses 500 randomized iterations per fuzz-style test.

### Pomodoro remaining-time fuzz test

**File:** `__tests__/Pommodoro.fuzz.test.tsx`

Covers the `calculateRemainingTime()` timer utility using randomized inputs:

- Verifies that remaining time is never negative.
- Verifies that the result is not `NaN`.
- Uses 500 randomized iterations.

### Reward system tests

**File:** `__tests__/RewardSystem.test.tsx`

Covers reward and badge display behavior:

- Displaying accumulated reward points.
- Showing reward loading state.
- Showing reward error state.
- Toggling reward detail visibility.
- Showing no earned badge below the first threshold.
- Displaying earned badges at 100, 200, 300, and higher point thresholds.
- Capping rendered badges at the available badge list.

### To-do screen tests

**File:** `__tests__/TodoScreen.test.tsx`

Covers the to-do route with a mocked Supabase data store:

- Rendering the to-do screen header.
- Showing the empty state when the user has no tasks.
- Adding a new task.
- Adding a task with a deadline.
- Preventing an empty task from being added.
- Marking a task complete.
- Editing a task title.
- Deleting a task.
- Filtering active tasks.
- Filtering completed tasks.
- Sorting tasks by nearest deadline.
- Scheduling deadline notifications for tasks with deadlines.
- Detecting overdue tasks.
- Keeping the route test focused by mocking `PomodoroTimer` separately.

### Chat Screen tests

**File:** '__tests__/Chat.test.tsx`

ChatScreen Route Test Coverage:

-Covers the chat route with a mocked Supabase data store that always returns no active check‑in.
-Rendering the chat screen’s loading state with a visible activity indicator.
-Showing the locked state when the user has no active check‑in.
-Displaying the lock icon, “Chat Locked” header, and explanatory message.
-Rendering the “Contribute Now” button for users who are not checked in.
-Ensuring no chat UI elements appear when the user is not verified:
-No message list
-No input field
-No send button
-No chat header
-Verifying that the route does not crash or enter infinite re-render loops when Supabase returns empty results.
-Keeping the route test focused by mocking navigation and Supabase behavior separately.



## How to run the tests

Run all commands from the project root.

### 1. Install dependencies

If dependencies are not already installed, run:

```bash
npm install
```

The test files assume the project already includes Jest, React Native Testing Library, Expo, Expo Router, Clerk, Supabase client code, and the app source files under `src/`.

### 2. Put the tests in the expected folder

Create the test folder if needed:

```bash
mkdir -p __tests__
```

Copy the uploaded test files into `__tests__/`:

```bash
cp Location.test.tsx __tests__/Location.test.tsx
cp Notifications.test.tsx __tests__/Notifications.test.tsx
cp PomodoroTimer.test.tsx __tests__/PomodoroTimer.test.tsx
cp ProfileFunctions.test.tsx __tests__/ProfileFunctions.test.tsx
cp SubmitStatus.test.tsx __tests__/SubmitStatus.test.tsx
cp Cooldown.fuzz.test.tsx __tests__/Cooldown.fuzz.test.tsx
cp Pommodoro.fuzz.test.tsx __tests__/Pommodoro.fuzz.test.tsx
cp RewardSystem.test.tsx __tests__/RewardSystem.test.tsx
cp TodoScreen.test.tsx __tests__/TodoScreen.test.tsx
```

If the files are already inside `__tests__/`, skip this step.

### 3. Run the full test suite

Use the project’s test script:

```bash
npm test
```

For more consistent output in CI or when debugging mock state, run Jest serially:

```bash
npm test -- --runInBand
```

If your project does not define a `test` script in `package.json`, run Jest directly:

```bash
npx jest --runInBand
```

### 4. Run a single test file

Use one of the following commands:

```bash
npx jest __tests__/Location.test.tsx --runInBand
npx jest __tests__/Notifications.test.tsx --runInBand
npx jest __tests__/PomodoroTimer.test.tsx --runInBand
npx jest __tests__/ProfileFunctions.test.tsx --runInBand
npx jest __tests__/SubmitStatus.test.tsx --runInBand
npx jest __tests__/Cooldown.fuzz.test.tsx --runInBand
npx jest __tests__/Pommodoro.fuzz.test.tsx --runInBand
npx jest __tests__/RewardSystem.test.tsx --runInBand
npx jest __tests__/TodoScreen.test.tsx --runInBand
npx jest __tests__/Chat.test.tsx --runInBand
```

### 5. Run in watch mode while developing

```bash
npm test -- --watch
```

Or, if using Jest directly:

```bash
npx jest --watch
```

## Important configuration notes

These tests import application files using paths such as:

```text
../src/...
src/...
```

Make sure the Jest configuration supports both relative imports and the `src` alias. A typical Expo/Jest setup may include configuration similar to:

```js
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
```

Only add or adjust this configuration if the project does not already have an equivalent setup.

## Important limitations

These tests are useful for validating component behavior and app logic, but they do not prove every production scenario works end-to-end.

- **External services are mocked.** Supabase, Clerk, Expo Location, Expo Notifications, Expo Router, DateTimePicker, icons, and some child components are mocked. These tests do not verify real network requests, real authentication, real database permissions, real push-token delivery, or real GPS behavior.
- **No real device coverage.** Permission prompts, background notifications, killed-app notification behavior, vibration, and OS-level navigation are only simulated. They should still be tested manually or with device/emulator-based end-to-end tests.
- **Limited backend validation.** Supabase calls are checked through mock chains, so the tests verify that expected calls are made, not that real database rows are written correctly.
- **Randomized fuzz tests are not seeded.** The cooldown and timer fuzz tests use random values. They check broad properties, but failures may be harder to reproduce unless the random inputs are logged or seeded in the future.
- **Some planned functional areas are not fully automated here.** The functional test plan includes app launch/navigation, home occupancy calculations, chat access, message behavior, inactive-user reminders, and some notification delivery scenarios. The uploaded automated tests only cover a subset of these areas.
- **Some tests simulate implementation logic directly.** For example, parts of the Pomodoro notification/vibration behavior are tested by directly calling mocked notification or native APIs, rather than always triggering the full behavior through the component.
- **Test accuracy depends on stable UI text.** Many tests query visible labels such as `START`, `RESET`, `Edit Profile`, `Sign out`, `Add New Task`, and `No To-Do's yet.` Text changes in the UI may require test updates even when behavior is still correct.
- **The test files assume a specific project structure.** The tests expect source files under `src/`, including app routes, components, utilities, config, and libraries. If files are moved, update import paths before running the tests.

## Recommended next steps

To strengthen coverage, add tests for:

- Home screen study spot occupancy display and floor-level status display.
- Chat access and message behavior.
- Real notification scheduling behavior in a device or emulator environment.
- End-to-end check-in flow using a test backend or seeded Supabase project.
- Seeded fuzz tests so random failures can be reproduced exactly.
