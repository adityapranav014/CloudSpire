# Deploying CloudSpire on Render

This repository is ready to be deployed on [Render](https://render.com) using the included `render.yaml` Blueprint.

## 🚀 Deployment Steps

1. Log into your Render dashboard.
2. Click **New** -> **Blueprint**.
3. Connect your GitHub repository (`CloudSpire`).
4. Render will automatically detect the `render.yaml` file and prepare two services:
   - **cloudspire-backend** (Node.js Web Service)
   - **cloudspire-frontend** (React Static Site)
5. **CRITICAL:** Before clicking "Apply", you need to fill in some environment variables!

## 🔐 Environment Variables You MUST Set in Render

Go to your **cloudspire-backend** service environment variables in the Render dashboard and add:
- `MONGODB_URI`: (Your shared MongoDB Atlas URL from `.env.shared`)
- `JWT_SECRET`: (From `.env.shared`)
- `BETTER_AUTH_SECRET`: (From `.env.shared`)
- `ENCRYPTION_KEY`: (From `.env.shared`)
- `OPENROUTER_API_KEY`: (From `.env.shared` - optional but recommended for AI chat)

Go to your **cloudspire-frontend** service environment variables and update:
- `VITE_API_URL`: Replace `REPLACE_WITH_BACKEND_URL` with your actual Render backend URL (e.g., `https://cloudspire-backend.onrender.com/api/v1`).

6. Click **Apply** and wait for both services to build and deploy!
