# 🎨 AI Image Generation Platform

A full-stack app where users register/login, generate images from text prompts, organize them into chat-style sessions, and browse their generation history.

- **Frontend:** React (Vite)
- **Backend:** Python FastAPI
- **Database:** PostgreSQL (SQLAlchemy ORM)
- **Auth:** JWT (python-jose) + bcrypt password hashing
- **AI provider:** HuggingFace Inference Providers (FLUX.1-schnell via fal-ai), with a free Pollinations.ai fallback

---

## ✨ Features

- 🔐 User authentication — register & login with JWT
- 🖼️ Prompt-based image generation
- 💬 Chat-style sessions that group prompts/images
- 📜 Per-session history **and** a global history page
- ✏️ Create, rename, and delete sessions
- ⬇️ Download generated images
- 🔎 Search across your prompt history
- ⏳ Loading states & responsive UI (works on mobile)

---

## 📁 Project structure

```
new/
├── main.py            # FastAPI app + all routes
├── auth.py            # JWT + password hashing helpers
├── database.py        # SQLAlchemy engine / session
├── model.py           # ORM models: User, chat_sessions, generated_image
├── schema.py          # Pydantic request/response schemas
├── requirements.txt   # Python dependencies
├── .env.example       # Sample environment variables
└── frontend/          # React (Vite) app
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── components/  (Auth, Sidebar, Chat, ImageCard, History)
    └── package.json
```

---

## 🗄️ Database schema

| Table | Columns | Relationships |
|-------|---------|---------------|
| `users` | id, email, hash, created_at | 1 user → many sessions |
| `chat_sessions` | id, user_id (FK), title, created_at | belongs to a user; 1 session → many images |
| `generated_images` | id, session_id (FK), image_url, prompt, created_at | belongs to a session |

Tables are created automatically on startup (`Base.metadata.create_all`).

---

## 🚀 Setup & run locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally (or use SQLite — see note below)

### 1. Backend

```bash
# from the project root
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# configure environment
cp .env.example .env               # then edit .env with your values
```

Create the database (once), e.g. in psql:
```sql
CREATE DATABASE ai_image;
```

Run the API:
```bash
uvicorn main:app --reload
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

> **No Postgres?** Set `DATABASE_URL=sqlite:///./app.db` in `.env` and it runs with zero setup.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# UI: http://localhost:5173
```

The frontend reads the backend URL from `frontend/.env` (`VITE_API_URL`, default `http://localhost:8000`).

---

## 🔑 Environment variables (`.env`)

| Variable | Description |
|----------|-------------|
| `Secret_key` | Secret used to sign JWT tokens (use a long random string) |
| `Algorithm` | JWT algorithm (default `HS256`) |
| `access_token` | Token expiry in minutes (default `30`) |
| `HF_API_TOKEN` | HuggingFace token — https://huggingface.co/settings/tokens |
| `DATABASE_URL` | e.g. `postgresql://postgres:PASSWORD@localhost:5432/ai_image` |
| `CORS_ORIGINS` | (optional) comma-separated allowed origins; default `*` |

A ready-to-copy sample lives in [`.env.example`](.env.example).

---

## 📡 API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | – | Register, returns JWT |
| POST | `/auth/login` | – | Login, returns JWT |
| POST | `/chat_sessions/create` | ✓ | Create a session |
| GET | `/chat_sessions` | ✓ | List your sessions |
| PUT | `/chat_sessions/{id}/rename` | ✓ | Rename a session |
| DELETE | `/chat_sessions/{id}` | ✓ | Delete a session |
| POST | `/chat_sessions/generate_image` | ✓ | Generate an image from a prompt |
| GET | `/chat_sessions/history/{id}` | ✓ | Images in one session |
| GET | `/history` | ✓ | All your images |
| GET | `/health` | – | Health check |

Authenticated requests send `Authorization: Bearer <token>`.

---

## 🖼️ How image generation works

`POST /chat_sessions/generate_image` calls `image_generation_service(prompt)` which:
1. Tries **HuggingFace** Inference Providers (FLUX.1-schnell via fal-ai) using `HF_API_TOKEN`.
2. If HF is unavailable (no token / out of free credits), falls back to **Pollinations.ai** (free, no key).

The resulting image **URL** is stored in `generated_images` with the prompt and timestamp.

---

## ☁️ Deployment (getting a live link)

- **Backend** → deploy to [Render](https://render.com) as a Web Service
  (start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`) with a managed Postgres,
  and set the env vars above.
- **Frontend** → deploy `frontend/` to [Vercel](https://vercel.com) or Netlify,
  setting `VITE_API_URL` to your deployed backend URL.

See the deploy steps in the submission notes.

---

## 🧰 Tech notes
- Passwords are hashed with **bcrypt** (never stored in plaintext).
- CORS is enabled so the React app can call the API cross-origin.
- `.env` and `app.db` are git-ignored — never commit secrets.
