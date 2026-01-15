# DevDocs AI Chatbot 🤖

AI-powered chatbot for developer documentation with code generation capabilities.

Built with FastAPI, Next.js 14, Pinecone, and Langfuse.

---

## ✨ Features

### 🔍 Documentation Q&A
- Ask questions about framework documentation
- Get AI-powered answers with cited sources
- Support for 7 popular frameworks
- View source documentation snippets

### 💻 Code Generation
- Generate production-ready code
- TypeScript support with full types
- Include/exclude documentation context
- Get usage examples and setup instructions

### 🎯 Framework Support
React • Next.js • Tailwind CSS • FastAPI • Django • PostgreSQL • TypeScript

---

## 🚀 Quick Start

### Backend
```bash
cd backend
cp .env.example .env  # Add your API keys
uv run uvicorn main:app --reload
```
Backend at: **http://localhost:8000**

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Frontend at: **http://localhost:3000**

---

## 📖 Documentation

- **[Build Plan](BUILD_PLAN.md)** - 3-day development plan
- **[Day 2 Testing](backend/DAY2_TESTING.md)** - Backend testing guide
- **[Day 3 Testing](DAY3_TESTING.md)** - Frontend testing guide
- **[Project Complete](PROJECT_COMPLETE.md)** - Full documentation
- **[API Docs](http://localhost:8000/docs)** - Interactive API docs

---

## 🏗️ Tech Stack

**Backend:** FastAPI • Claude AI • Pinecone • Langfuse • UV

**Frontend:** Next.js 14 • TypeScript • Tailwind • Zustand • TanStack Query

---

## 🎯 Usage

1. **Select frameworks** you want to query
2. **Choose mode**: Documentation Q&A or Code Generation
3. **Ask questions** or request code
4. **View results** with sources or generated code

---

## 🚢 Deployment

**Backend:** Render, Railway, or Fly.io

**Frontend:** Vercel (one-click deploy)



---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/chat` | POST | Documentation Q&A |
| `/api/generate` | POST | Code generation |
| `/api/chat/feedback` | POST | Submit feedback |

---

## 🤝 Contributing

Personal project - feel free to fork and adapt for your needs!

---

