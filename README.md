# Task Management Application

A beginner-friendly full-stack task manager with:
- User registration and login (JWT authentication)
- User-specific task CRUD (create, read, update, delete)
- Task status, priority, and due date
- Responsive React interface
- Express + MongoDB backend

## Requirements
- Node.js 18+
- MongoDB local installation or MongoDB Atlas connection string

## 1. Configure the backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.

## 2. Start the backend
```bash
npm run dev
```
API runs at `http://localhost:5000`.

## 3. Start the frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

## Notes
- This is a learning starter, not a production-hardened deployment.
- Use a long random JWT secret and never commit `.env`.
- Passwords are hashed with bcryptjs. The API checks the token and scopes task operations to the signed-in user.
