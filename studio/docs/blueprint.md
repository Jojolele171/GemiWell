# **App Name**: GemiWell

## Core Features:

- AI Health Chat: Chat interface powered by Gemini to provide personalized health coaching, diet, lifestyle and exercise advice. It will explicitly state the uncertainty of its advice and will act as a tool.
- Medical Report Summarization: Allow users to upload medical reports, which are then summarized by Gemini. Display AI confidence level for each summary and uploaded reports will be saved to cloud storage.
- Diet and Calorie Tracking: Enable users to log their daily food intake and track calorie counts. Saved on a SQL database.
- Health Habit Tracking: Track user's basic health habits (sleep, steps, water intake) which are saved in the SQL database.
- Doctor Linking: Allow users to link to a doctor, enabling the doctor to view AI summaries, review reports, and add notes. Uses Firestore.
- Doctor vs AI Reasoning: Allow doctors to compare their opinions with AI's reasoning on patient data.
- User Authentication: Secure user authentication via Firebase Auth with Google and Email/Password Sign-In.

## Style Guidelines:

- Primary color: Soft teal (#63FFDA) for a calming and trustworthy feel.
- Background color: Very light teal (#E0F7F2) to complement the primary.
- Accent color: Muted green (#47FFB3) to create a relaxing, almost underwater-like environment.
- Body and headline font: 'PT Sans' (sans-serif) for a modern and readable interface.
- Note: currently only Google Fonts are supported.
- Use clean, line-based icons related to health and wellness.
- Clean, dashboard-style layout for tracking and summaries.
- Subtle transitions and animations for a smooth user experience.