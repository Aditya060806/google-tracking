# Cloud Jam Tracker

Welcome to the my version of **Google Cloud Study Jams Tracker** for GDG Chandigarh University! This open-source project is a dynamic, feature-rich web application built to track and display the progress of participants in the Google Cloud Study Jams. It provides a gamified and engaging experience for the community.

## ✨ About The Project

This platform was created to provide live progress updates, leaderboards, and important resources for participants of the Google Cloud Study Jams organized by GDG CU. It aims to foster a sense of competition and community by visualizing individual and team achievements.

### Built With

The project leverages a modern, robust, and scalable tech stack:

*   [Next.js](https://nextjs.org/) - The React Framework for the Web
*   [React](https://react.dev/) - A JavaScript library for building user interfaces
*   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript for robust applications
*   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework

## 🚀 Key Features

As per the project blueprint, the tracker includes:

-   **🏠 Landing Page**: A central dashboard displaying key metrics like total participants, overall completion rate, and a countdown timer. It also highlights the top performers of the day.
-   **📚 Syllabus & Learning Path**: The 10 skill badges of the Student and Developer curricula, with credits needed, how many participants earned each badge, and links to Google Skills.
-   **🏆 Progress & Leaderboard**: A live leaderboard of all participants, highlighting the top performers with special badges and medals.
-   **🤝 Team Leaderboard**: Team rankings, mentors, and member progress (shown when teams are assigned in `data/teams.csv`).
-   **ℹ️ About Section**: A static page with information about the Study Jams program, GDG CU, and the organizing team.
-   **🌙 Dark Mode**: A sleek, user-friendly dark mode toggle, with the default set to dark for a modern feel.
-   **📱 Fully Responsive**: A beautiful and consistent experience across all devices, from mobile to desktop.

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your development machine:

*   **Node.js**: Version 18.18.0 or later. You can download it from [nodejs.org](https://nodejs.org/).
*   **npm**, **yarn**, or **pnpm**: A package manager for JavaScript. This guide will use `npm`.

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/NamVr/Cloud-Study-Jams-Tracker.git
    cd Cloud-Study-Jams-Tracker
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Run the development server**
    ```sh
    npm run dev
    ```

4.  Open http://localhost:9002 with your browser to see the result.

### Updating the Data (Daily)

Google emails a participant progress report (CSV) every day. To publish it:

1.  Save the CSV in `data/reports/` with its original name, e.g. `GDGC-CUCHD [13 Nov].csv`. Keep the older reports there too: finishing order is worked out by comparing them.
2.  Run `npm run ingest`. It reads every report and writes `src/data/leaderboard.json`.
    *   `npm run dev` and `npm run build` run the ingest step automatically.
    *   `npm run ingest:watch` regenerates the data as soon as a new CSV lands in the folder.
3.  Commit `src/data/leaderboard.json` and push it to deploy.

The raw CSVs contain participants' emails and access codes, so `data/reports/` and all `*.csv` files are gitignored. The generated file only holds names, public profile URLs and badge progress. If Google renames a column, the ingest step stops with a message naming the missing column.

How the numbers are calculated (in `src/lib/leaderboard.ts`):

*   **Progress**: skill badges completed out of 10, as counted by Google.
*   **Rank**: the order in which participants completed all 10 badges, based on the first daily report that shows it. People who finished in the same report share a rank.
*   **Swag eligible**: a rank within the swag limit (first 100 finishers by default).

Campaign settings (name, deadline, both curricula with course links, swag rule, team colors and mentors) live in `src/config/campaign.json`.

**Teams (optional):** add `data/teams.csv` with an `Email` column and a `Team` column, then run `npm run ingest`. The Teams page and nav link appear once at least one participant has a team.

## 🔧 Hosting & Deployment

The easiest way to deploy your Next.js app is to use the Vercel Platform from the creators of Next.js.

Check out the Next.js deployment documentation for more details on how to deploy to Vercel or other platforms like Netlify, AWS, or your own server.

### Steps for Vercel Deployment

1.  **Push your code** to a Git repository (GitHub, GitLab, Bitbucket).
2.  **Import your project** on Vercel.
3.  Vercel will automatically detect that you are using Next.js and will configure the build settings for you.
4.  **Deploy!** Your application will be live in minutes.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Don't forget to give the project a star! Thanks again!

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

Project Link: https://github.com/NamVr/Cloud-Study-Jams-Tracker

---