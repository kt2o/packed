## Workflow and Design Choices
1. The user signs into the app with email, username, and password.
2. Once the user is verified, they appear at home screen.
3. User is able to look at different CWRU locations.
4. By clicking one location, the user is able to expand the different floor levels inside. 
5. In the Submit page, the user is able to click the dropdown and select a location. The user is able to choose a status for the location. A pop up will appear to verify the user is nearby the location. If the user successfully verifies their location, the input is recorded, the home screen is adjusted with the new data, and a reward point is awarded to the user. If the user is unsucessful, the app will display an error pop up. The output will be a change in the location's status in the home screen. 
6. In the To-Do page, the user is able to create a new task with a title and a deadline. By clicking add, the new task is added to the screen. The user is able to see three filters on the tasks: all, active, complete. The user is able to click on the task to set it as complete or active. Depending on the status of the task, the task is filtered between "all," "active," and "complete." The user is able to edit the task to change the title. The user is able to permanently delete the task. 
7. In the To-Do page, the user is able to click into the Pomodoro timer function. The user will be able to start the 25-minute timer or the 5-minute timer. The user is able to pause the timer. 
8. In the Profile page, the user is able to view profile with username, email, and profile picture. The user is able to see how many reward points they have collected so far. A message is displayed for the next badge they would qualify for based on reward points, as well as how many points are left to reach this milestone. Earned badges will be appended in the profile section above. A pop up is also displayed to user that describs the reward system. Below, the user is able to sign out. 

* Key choices
    * Backend: Supabase 
        * Familiarity with services.
        * Free option.
    * Front end: React Native
        * Standard language for apps.
        * Works well with both iOS and Android.
    * Authentication: Clerk
        * Non-centralized workflow.
        * Efficient integration.
        * Provides large user database (up to 10k users).
        * Expo provides an easier setup/development for for application development (and works for both ios and andoird), and has a large library of pre-built native modules
        * Clerk allows seemless integration of a strong authentication system within the application
        * Supabase works as the backend, holding the database and allowing strong security features for data handling and safety. It also works well with CLerk, and allows socket programming functionalities 
    * Structure of App:
         * It was important to separate the functionalites so the user experience was intuitive and practical. The first page is made for simply viewing which locations are available (the main purpose of the app). At their own discretion, users can share their location and contribute to the app (this is why it is left separate from the location viewing screen). We provided a user section (titled To Do) which is made to hold all things that a student may need to rely on in their academic endeavors. The profile page is for personal use and practical displays (like their earned points and username), and the location chat is used for students to build their network. 
    * Trade-offs/Challenges:
        * Setting up Clerk can be done in many ways, which took a bit of time to figure out and configure for our specific application.
        * Configuring the check in with the status submission was difficult especially since I was using an Android emulator. We also changed the logic flow a few times, so making those changes halted progress a bit.
        * Allowing multiple users to chat at once was hard because we had to figure out the RLS configurations. In addition, limiting the chat rooms based on the location wasn't obvious, a bit tedious, but in the end came out to work properly.
        * The original deadline code in the To-Do page was not working correctly for both iOS and Android. It only worked for iOS, therefore we had to use Platform on Expo to distinguish between the two and customize the code to work in their respective environments. 

## Code Quality and Standards
* This project is designed with modular components to improve maintainability and scalability.
    * Components are seperated by responsiblity:
        * UI components
        * API/service functions
        * Utility/helper function
    * This allows for:
        * Easier debugging.
        * Code reuse.
        * Cleaner organization.

* The project follows consistent coding practices:
    * Clean and descriptive variable/function names.
    * Consistent formatting and indentation.
    * Comments added where necessary.
    * Seperation of concerns.

## Software Quality Features
* Error Handling:
    * The application includes mechanisms to handle errors:
        * Input validation.
        * Error messages displayed. 
        * Try/catch blocks.

* Usability:
    * The app is designed to be user-friendly:
        * Simple navigation.
        * Clear instructions and labels.
        * Minimal steps required for actions.

* Appearance:
    * The interface is designed for clarity and consistency:
        * Clean layout and spacing.
        * Consitent color scheme and typography.
        * Organized visual hierarchy.
        * Focus on readability.

## AI Assistance 
* AI tools used:
    * Claude.
    * Microsoft Copilot.
    * Gemini.
    * ChatGPT.

* How AI Assisted:
    * Suggesting refactoring for modularity.
    * Improving readability and structure.
    * Helping write documentation.
    * Assisting with debugging issues.

* Reflection:
    * What worked well: 
        * Creating extensive test cases.
        * Debugging test case failures.
        * Generating test cases quickly.
    * Limitations of AI: 
        * Lacked context for the code behind app.
        * Struggled mocking objects.
    * How we ensured correctness: 
        * Tested the cases using Jest.

## Verification and Testing
* Testing 
    * Automated testing with Jest.
    * Testing of a couple of key features.
    * Advanced testing method: fuzz testing on two features.

* Code Quality Checks
    * Formatting tools used.
    * Code reviewed for modularity and readability.
    
* Final Validation
    * Confirmed all major features work as expected. 
    * Ensured UI is responsive and user-friendly.
    * Verified no major bugs remain.
