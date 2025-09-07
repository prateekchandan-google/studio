This project was done completely vibe-coded by firebase studio. This was made of Treasure hunt organised for  Google TV  team bangalore Ananta campus on 10th September 2025

# Google TV Treasure Hunt 2025

Welcome to the official repository for the Google TV Treasure Hunt application! This is an interactive, real-time scavenger hunt web application built with Next.js, Firebase, and a sprinkle of AI magic with Genkit.

## Overview

This application facilitates a time-based treasure hunt where teams compete to solve a series of puzzles. It includes a full-featured player experience and a comprehensive admin panel for game management.

## Player Features

### Team Management
- **Team Registration**: New teams can register through a simple form. They can add between 3 to 7 members and select a house (`Halwa`, `Chamcham`, `Jalebi`, `Ladoo`).
- **AI-Powered Name Generation**: Teams can use an AI assistant to generate creative, adventurous team names based on their chosen house and Indian cultural themes.
- **Unique Secret Code**: Upon registration, each team receives a unique secret code which is used for logging in.

### Login & Session Management
- **Secret Code Login**: Players join their team by entering the unique secret code.
- **Player Selection**: After login, users select their name from the team's member list to start their session.
- **Persistent Sessions**: The application remembers the active team, so players can easily rejoin the game.

### Gameplay Experience
- **Timed Challenge**: The entire game is limited to a **60-minute** duration, with a real-time timer visible on the game screen.
- **Puzzle Paths**: Teams are automatically assigned to one of several puzzle paths, ensuring a varied experience.
- **Real-time Puzzle Solving**: Players are presented with one puzzle at a time, including a title and the riddle itself.
- **Photo Submissions**: A key feature of the game is that every text-based answer **must be accompanied by a supporting photograph**. This is handled via file upload or a built-in camera interface.
- **Hints & Skips**:
  - **Hints**: Teams can request a hint for a point penalty. A standard hint is available after 5 minutes, with an option for an immediate hint at a higher cost.
  - **Skips**: If a team is truly stuck, they can skip a puzzle after a 10-minute delay.
- **Live Team Status**: Players can see which of their teammates are currently online and active in the game.

### Scoring & Leaderboard
- **Live Scoreboard**: A publicly accessible scoreboard displays the rankings of all teams in real-time, based on their scores.
- **House Points**: The scoreboard also aggregates points for each house, fostering a larger sense of competition.

## Admin Panel

The application includes a secure, feature-rich admin panel for complete control over the game.

### Game Control
- **Master Switches**: Admins have master controls to start/stop the entire game and open/close team registrations.
- **Game Timer Control**: The admin dashboard shows when the game was officially started.
- **Exit Override**: A special switch allows admins to enable players to exit the game, primarily for testing and debugging.

### Submission Review
- **Real-time Queue**: Submissions from all teams appear in the admin dashboard in a real-time queue.
- **Approve/Reject**: Admins can review the text and photo submission for each puzzle and approve or reject it with a single click.
- **AI-Assisted Analysis**: Admins can trigger a Genkit AI flow to analyze a submission, providing an objective "second opinion" and a confidence score.

### Puzzle Management
- **Create & Edit Puzzles**: Admins can create new puzzles, providing the riddle, answer, and an optional hint. An AI-powered title generator can suggest creative, gibberish titles for new puzzles.
- **Drag-and-Drop Organization**: Puzzles are organized into five distinct paths. Admins can easily reorder puzzles within a path or move puzzles between paths using a drag-and-drop interface.
- **Detailed View**: A "Detailed View" toggle allows admins to see all puzzle information at a glance without needing to open each one.

### Team Management
- **View All Teams**: A comprehensive table lists all registered teams, their members, scores, and progress.
- **Edit Team Details**: Admins can edit team names, houses, and member lists. They can also award bonus points.
- **Delete Teams**: Teams can be permanently removed from the game.

### Submission Gallery
- **Photo Gallery**: A beautiful, masonry-style gallery displays all the photo submissions from all teams, creating a visual record of the event.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: React, TypeScript, ShadCN UI, Tailwind CSS
- **Backend & Database**: Firebase (Firestore for real-time data, Firebase Storage for images (implicitly))
- **Generative AI**: Google Genkit for AI-powered flows (team name and puzzle title generation).
- **Styling**: Tailwind CSS with CSS Variables for theming.
- **Deployment**: Firebase App Hosting.
- **Drag & Drop**: `@dnd-kit` for the puzzle management interface.
