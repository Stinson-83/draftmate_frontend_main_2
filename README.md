# DraftMate - AI Legal Document Drafting Platform

DraftMate is an advanced AI-powered platform tailored for legal professionals. It streamlines the legal workflow by providing tools for document drafting, deep case law research, PDF analysis, and case file management.

---

## ⚡ Quick Start (The Easiest Way)

You can get the entire DraftMate application (Frontend, Backend, and Database) running with just a few commands using Docker. 

### Step 1: Install Prerequisites
If you haven't already, install **[Docker Desktop](https://www.docker.com/products/docker-desktop)** and ensure it is running.

### Step 2: Set up Environment Variables
Create a `.env` file in the root directory. You can copy the template:
```bash
cp .env.example .env
```
*(Open the `.env` file and fill in your API keys for OpenAI, Google, AWS, etc., if you want AI features to work).*

### Step 3: Run the Application
Run this single command in your terminal from the project root:
```bash
docker compose up --build
```

**That's it!** Docker will automatically download everything, build the application, and start the servers. 
*   Wait for the terminal logs to settle, then open your browser and go to: **[http://localhost:8080](http://localhost:8080)**

---

## 🏗 Architecture Overview

DraftMate is structured around a React (Vite) frontend and multiple Python-based backend microservices, unified behind an Nginx reverse proxy. 

Currently, the application is packaged into a **Monolithic Docker Image** (`draftmate_frontend_main_2-frontend:latest`) for ease of deployment, managed by `supervisord` which runs Nginx and all backend services concurrently.

### Core Services:
*   **Frontend**: React SPA built with Vite and Tailwind CSS.
*   **Converter (8000)**: Document conversion.
*   **Query (8001)**: Template management.
*   **Enhance Bot (8002)**: AI clause enhancement.
*   **Drafter (8003)**: Legal document generation.
*   **Lex Bot (8004)**: Deep research assistant with SSE streaming.
*   **PDF Editor (8005)**: PDF manipulation (merge, split, OCR).
*   **Auth Service (8009)**: User authentication and sessions.

---

## 💻 Manual Local Development (For UI Developers)

If you are only working on the React UI and want instant hot-reloading without rebuilding Docker images:

1. **Install Node.js**: Ensure you have [Node.js](https://nodejs.org/) installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Frontend**:
   ```bash
   npm run dev
   ```
*Note: The frontend expects the backend API to be running. You should run `docker compose up` in the background to provide the backend services.*

---

## ☸️ Kubernetes Deployment (Helm)

For production or cluster testing, DraftMate includes a Helm chart in the `./draftmate-chart` directory.

### Prerequisites
*   A running Kubernetes cluster (e.g., `kind`, `minikube`).
*   [Helm 3](https://helm.sh/) installed.
*   An Ingress Controller installed on your cluster.

### 1-Click Cluster Setup (Advanced)
If you have `kind` and `helm` installed, follow these steps to deploy:

1. **Build the Image** (Make sure your `.env` has `VITE_CLIENT_ID`):
   ```bash
   VITE_CLIENT_ID=$(grep "^VITE_CLIENT_ID=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
   docker build --build-arg VITE_CLIENT_ID=$VITE_CLIENT_ID -t draftmate_frontend_main_2-frontend:latest -f Dockerfile .
   ```

2. **Load Image into Kind**:
   ```bash
   kind load docker-image draftmate_frontend_main_2-frontend:latest --name your-cluster-name
   ```

3. **Deploy with Helm**:
   ```bash
   helm upgrade --install draftmate ./draftmate-chart -n draftmate --create-namespace
   ```

Ensure your `/etc/hosts` file maps `draftmate.test` to your local ingress IP (e.g., `127.0.0.1`), then visit `http://draftmate.test`.

---

## 📝 Troubleshooting

*   **Blank Blue Screen on Load**: This indicates an Ingress routing issue or an insecure context. Ensure your ingress points correctly to the root path without `rewrite-target: /`. Access the site via `http://localhost` or set up HTTPS, as some React features (like `crypto`) require secure contexts to run.
*   **OOMKilled Pods**: The monolithic application requires significant memory for ML models. Ensure Docker Desktop is allocated at least `4GB` of RAM, or update your Kubernetes node resources.


---

## Vite Default Documentation

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [	ypescript-eslint](https://typescript-eslint.io) in your project.
