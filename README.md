# Packed App

Packed App is a cross-platform mobile application designed specifically for CWRU students. It enables users to find, share, and monitor real-time availability and crowdedness of campus study spots, helping students optimize their study sessions through community-driven data.

---

## Architecture Overview
The application follows a **Client-Server architecture** utilizing a **Backend-as-a-Service** model.

* **Frontend:** A React Native mobile client built with Expo, using TypeScript for type safety.
* **Backend:** Supabase handles our PostgreSQL relational database, user authentication (via Clerk integration), and real-time data subscriptions for the chat feature.

The following diagram illustrates our data model, highlighting the core `CrowdReport` and `StudySpot` relationships that power the real-time status updates.

<img width="407" height="432" alt="Packed-ER" src="https://github.com/user-attachments/assets/089b6299-1a63-4e88-83fd-50a19a79b8ec" />

---

## Tech Stack
* **Frontend:** React Native (Expo SDK)
* **Backend/Database:** Supabase (PostgreSQL)
* **Authentication:** Clerk / Supabase Auth
* **Language:** TypeScript
* **Libraries:** Expo Location (GPS), React Navigation (Tabs/Stack)

---

## Repository Folder Structure
```
packed-app/
├── assets/                 # Images, icons, and static fonts
├── supabase/               # Migrations and database configuration
└── src/                    # Main source code
    ├── app/                # Expo Router file-based routing
    │   ├── (auth)/         # Authentication flow (Sign-in/Sign-up)
    │   ├── (protected)/    # Main app functionality (requires login)
    │   │   └── (tabs)/     # Tab-bar navigation (Home, Chat, Profile, Submit, Todo)
    │   └── spot/           # Dynamic routes for individual study spot details
└── components/             # Reusable UI components (Buttons, Cards, Inputs)
├── features/               # Modular business logic
├── lib/                    # Third-party service clients (Supabase/Clerk init)
├── providers/              # React Context providers (Auth, Theme)
└── types/                  # TypeScript interface and type definitions
```
## Installation & Setup

> **Note to TA:** Please ensure you have an emulator configured (Android Studio).

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/kt2o/packed
    cd packed
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    To protect project credentials, we use a `.env` file. 
    * Create a file named `.env` in the root directory.
    * Populate it with the exact keys provided in our assignment submission notes:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=paste_from_comments
    EXPO_PUBLIC_SUPABASE_ANON_KEY=paste_from_comments
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=paste_from_comments
    ```

4.  **Start the Development Server:**
    ```bash
    npx expo start
    ```
    * Press **'a'** for Android

---

## Usage Example

* **Check-in:** Navigate to the **Submit** tab while at a campus location (like KSL Library).
* **Report:** Select the "Crowdedness" level (**Empty** or **Packed**).
* **Chat:** Join the location-specific chat room to ask peers about available outlets or seating.
* **Earn:** Receive points toward the **Rewards** system for every valid report submitted.

---

## Team Roles & Contributions

| Member | Role | Primary Contributions |
| :--- | :--- | :--- |
| **Diego** | Team Lead | User Profile, Auth logic, UI/UX Design, Pomodoro Timer, Chat Feature. |
| **Deethya** | Backend Lead | Location permissions, DB Schema/Functions, Notifications, Chat infrastructure. |
| **Gabi** | Frontend Dev | Home Screen, Submit Page functionality, Chat UI components. |
| **Josi** | Frontend Dev | Rewards System, Home Screen, Task Manager, UI/UX Design. |

---

## Retrospective & Lessons Learned

* **Platform-Specific Logic:** We discovered that standard code doesn't always behave identically across OSs. For instance, the To-Do deadline picker required using the `Platform` module from Expo to provide distinct implementations for iOS and Android to ensure a consistent user experience.
* **State & Flow Management:** Designing the Check-in logic taught us that data flow is rarely linear. We iterated on the logic flow several times to ensure status submissions updated the global `CrowdReport` table accurately without race conditions.
* **Security vs. Accessibility:** Implementing **Row Level Security (RLS)** in Supabase for the chat feature was a significant hurdle. We learned how to balance open communication within a location-based room while ensuring users only access data pertinent to their current session.
* **Hardware Emulation:** Testing location-based features and UI interactions on Android emulators proved difficult compared to physical devices, emphasizing the need for early and frequent on-device testing.

---

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivs (CC BY-NC-ND)**
