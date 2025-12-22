# 🕰️ Timeline of Me

**Timeline of Me** is a full-stack personal journaling web application that allows users to store and
revisit memories using **text entries, images, and audio notes**, organized in a chronological
timeline.

The project focuses on understanding full-stack workflows, cloud storage, and integrating external
services into a real-world application.

---

## 🌟 Project Overview
- Create journal entries using **text, photos, or audio**
- Store and organize entries in a **timeline-based view**
- Enable **search and filtering** to find past entries
- Enhance entries using cloud-based AI services

---

## ✨ Features
- Text, image, and audio journal entries
- Chronological timeline view
- Search and basic filtering
- Secure authentication
- Media uploads and cloud storage integration

---

## 🏗 Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend & Cloud
- Next.js API Routes (REST APIs)
- Azure Blob Storage (media uploads using SAS tokens)
- Azure Cosmos DB (NoSQL database)

### AI & Authentication
- Azure Cognitive Services (used for transcription and tagging)
- OAuth-based authentication (Google and GitHub)

---

## 🔄 Application Flow (High-Level)
1. User authenticates using Google or GitHub
2. User creates a journal entry (text, image, or audio)
3. Media files are uploaded securely to Azure Blob Storage
4. Entry metadata is stored in Cosmos DB
5. Cloud services process content where applicable
6. Entries are displayed in a searchable timeline

---

## 🧠 What I Learned From This Project
- Building a full-stack application using Next.js
- Designing and consuming REST APIs
- Handling file uploads and cloud storage
- Working with NoSQL databases
- Integrating third-party authentication
- Understanding asynchronous requests and external service integration

---

## 🎯 Project Goal
To gain hands-on experience building a full-stack application and understanding how cloud services
can be integrated into modern web applications.

---

## 📝 License
MIT License
