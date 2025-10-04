# Privio: Secure HLS Streaming Platform

A full-stack application for securely uploading, transcoding, and streaming private video content with advanced sharing and real-time analytics.

## Key Features
* **Secure User Authentication:** Sign up and log in with Google OAuth.
* **Automated Transcoding Pipeline:** Videos are automatically transcoded to HLS with multiple resolutions upon upload.
* **Secure HLS Streaming:** Private video content is served via temporary, secure signed URLs.
* **Advanced Sharing:** Generate expirable, user-specific share links for private videos.
* **Real-Time Analytics:** Track viewer counts and last-viewed timestamps in real-time using Redis.

## Tech Stack & Architecture
This project uses a decoupled architecture to separate the user-facing frontend from the resource-intensive backend processing.
* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Backend (Transcoding):** Node.js, Express, FFMpeg
* **Database & Storage:** Supabase (PostgreSQL, Storage, Auth)
* **Real-Time Analytics:** Redis (Upstash)
* **Deployment:** Vercel (Frontend), Render (Backend)


## Local Setup
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/gsgit123/privio.git](https://github.com/gsgit123/privio.git)
    cd privio
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the necessary keys for Supabase, Render, and Upstash.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```