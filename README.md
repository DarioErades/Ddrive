# Ddrive - Discord File Storage System

Ddrive is a full-stack application that leverages Discord as a backend for file storage. It allows you to upload, manage, and organize files within a Discord channel through a modern web interface.

## Features

- **Discord Backend**: Uses a Discord bot to store files in a designated channel.
- **File Management**: Create folders, move files, rename, and star important files.
- **Trash System**: Soft delete files with the ability to restore or permanently delete.
- **Authentication**: Secure login system using JWT.
- **Large File Support**: Designed to handle large uploads (subject to Discord's limits).
- **Modern UI**: Built with React and Tailwind CSS for a responsive, dark-themed experience.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: SQLite (for metadata and configuration).
- **Storage**: Discord API.

## Prerequisites

- Node.js (v18+)
- A Discord Bot Token.
- A Discord Channel ID where files will be stored.

## Installation

1. Clone the repository.
2. Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Configuration

1. Create a `.env` file in the `backend` directory (you can use `.env.template` as a base).
2. Add your credentials:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id
JWT_SECRET=your_jwt_secret
PORT=3001
```

## Running the Application

### Using Docker (Recommended)

Run the entire stack using Docker Compose:

```bash
docker-compose up -d
```

### Manual Start

1. **Start the Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at `http://localhost:5173` (or the port shown by Vite), and the backend will run on `http://localhost:3001`.

## Security Warning

**DO NOT** publish your `.env` file or hardcode your `DISCORD_TOKEN` in the source code. Ensure that `.env` is added to your `.gitignore`.
