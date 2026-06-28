# TrendEase

TrendEase is a modern web application built with **React**, **TypeScript**, and **Vite**. 

This project is configured to be deployed automatically to GitHub Pages as a sub-project (e.g., `https://<your-username>.github.io/TrendEase`), allowing you to host it alongside a main portfolio page.

## 🚀 Getting Started

To run this project locally on your machine, follow these steps:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v20 or higher recommended) installed.

### Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/your-username/TrendEase.git
   cd TrendEase
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the app. The page will reload automatically if you make edits.

## 📦 Building for Production

To build the app for production to the `dist` folder:
```bash
npm run build
```

## 🌐 Deployment to GitHub Pages

This project includes a **GitHub Actions workflow** (`.github/workflows/deploy.yml`) that automates the deployment process. 

To deploy your app:
1. Push your code to the `main` or `master` branch.
2. In your GitHub repository, go to **Settings > Pages**.
3. Under **Build and deployment**, set the **Source** to **GitHub Actions**.

Whenever you push new changes to the main branch, GitHub Actions will automatically build your app and deploy it to `https://<your-username>.github.io/TrendEase`.

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Linting:** [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)
