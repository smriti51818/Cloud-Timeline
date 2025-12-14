# 🕰️ Timeline of Me

**Timeline of Me** is a full-stack, cloud-based personal journaling application that allows users to
capture and revisit life moments using **text entries, photos, and voice notes** — all organised in a
chronological timeline and enhanced with AI.

The project focuses on combining modern web development with cloud and AI services to make personal
memories easier to store, search, and explore.

---

## 🌟 What This Project Does
- Lets users create journal entries with **text, images, or audio**
- Automatically enriches entries using **AI-driven tagging, transcription, and sentiment analysis**
- Displays memories in a **clean, chronological timeline**
- Provides **search and filtering** to quickly find past moments

---

## ✨ Key Features
- 📝 Text, photo, and voice-based journal entries
- 🤖 AI-powered tagging and sentiment analysis
- 🎙 Voice-to-text transcription for audio notes
- 🔍 Search and filter entries by date and content
- 🕰 Chronological timeline view

---

## 🏗 Tech Stack

### Frontend
- Next.js (React)
- TypeScript
- Tailwind CSS

### Backend & Cloud
- Next.js API Routes (REST APIs)
- Azure Functions
- Azure Cosmos DB (NoSQL)
- Azure Blob Storage (media uploads using SAS tokens)

### AI & Authentication
- Azure Cognitive Services (Vision, Speech, Text Analytics)
- Azure OpenAI Service
- Authentication via **Google and GitHub** (OAuth)

---

## 🔄 How It Works (High-Level)
1. User signs in using Google or GitHub
2. Creates a journal entry (text, image, or audio)
3. Media files are uploaded to Azure Blob Storage using SAS URLs
4. Metadata and entry data are stored in Cosmos DB
5. AI services process content for tags, sentiment, and transcription
6. Entries are displayed in a searchable, chronological timeline

---

## 🧠 Key Skills Demonstrated
- Full-stack application development
- REST API design
- Cloud storage and media handling
- NoSQL data modeling with Cosmos DB
- Asynchronous requests and data pipelines
- Integration with AI and cognitive services
- Authentication and third-party OAuth

---

## 🎯 Project Goal
To build a **modern, cloud-native journaling application** that demonstrates how AI and cloud
technologies can enhance personal data experiences.

---

## 📝 License
MIT License
