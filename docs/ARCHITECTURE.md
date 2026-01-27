# Cloud Timeline Architecture

## System Overview

The Cloud Timeline application is a modern, cloud-native web application built on Azure services with a Next.js frontend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Next.js Frontend (React)                  │   │
│  │  • Timeline View  • Dashboard  • Upload Interface    │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Layer                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  NextAuth.js + Microsoft Entra ID (Azure AD)         │   │
│  │  • OAuth 2.0  • JWT Tokens  • Session Management     │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Next.js API Routes (REST API)                │   │
│  │  /api/entries  /api/upload  /api/transcribe         │   │
│  └─────────────────────────────────────────────────────┘   │
└───┬────────────────┬────────────────┬───────────────────────┘
    │                │                │
    ▼                ▼                ▼
┌─────────┐   ┌─────────────┐  ┌──────────────────────┐
│  Azure  │   │   Azure     │  │  Azure Cognitive     │
│ Cosmos  │   │   Blob      │  │    Services          │
│   DB    │   │  Storage    │  │  • Vision            │
│         │   │             │  │  • Speech            │
│         │   │             │  │  • Text Analytics    │
└─────────┘   └─────────────┘  └──────────────────────┘
```

---

## Component Details

### 1. Frontend (Next.js + React)

**Technology**: Next.js 14 with App Router, TypeScript, Tailwind CSS

**Key Components**:
- `Timeline View` - Displays entries chronologically
- `Dashboard` - Analytics and insights
- `Upload Modal` - Media upload interface
- `Voice Recorder` - Audio recording component

**State Management**:
- React hooks (useState, useEffect)
- Server state via Next.js API routes
- Session state via NextAuth.js

**Routing**:
```
/                   → Landing page
/login              → Authentication page
/timeline           → Main timeline view
/dashboard          → Analytics dashboard
/insights           → AI insights
/story              → Story mode
/voice              → Voice entries
```

---

### 2. Authentication (Microsoft Entra ID)

**Flow**:
```
1. User clicks "Login"
2. Redirected to Azure AD OAuth endpoint
3. User authenticates with Microsoft account
4. Azure AD returns authorization code
5. NextAuth exchanges code for access token
6. JWT session created and stored
7. User redirected to /timeline
```

**Protected Routes**:
- Middleware checks JWT token on each request
- Unauthenticated users redirected to /login
- Token refresh handled automatically

---

### 3. API Layer (Next.js API Routes)

**Endpoints**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/entries` | GET | Fetch all user entries |
| `/api/entries` | POST | Create new entry |
| `/api/entries/[id]` | GET | Get single entry |
| `/api/entries/[id]` | PUT | Update entry |
| `/api/entries/[id]` | DELETE | Delete entry |
| `/api/upload` | POST | Upload media file |
| `/api/transcribe` | POST | Transcribe audio |
| `/api/analyze-sentiment` | POST | Analyze text sentiment |
| `/api/categorize-text` | POST | Categorize text |
| `/api/generate-prompt` | GET | Generate journal prompt |
| `/api/random-entry` | GET | Get random past entry |

**Error Handling**:
- Centralized error handler (`lib/error-handler.ts`)
- Consistent error response format
- HTTP status codes for different error types

---

### 4. Data Layer (Azure Cosmos DB)

**Database Structure**:

```json
{
  "databaseId": "timeline-db",
  "containers": [
    {
      "id": "timeline-entries",
      "partitionKey": "/userId",
      "schema": {
        "id": "string (UUID)",
        "userId": "string",
        "type": "photo | voice | text",
        "title": "string",
        "description": "string?",
        "date": "ISO date string",
        "mediaUrl": "string? (Blob URL)",
        "transcription": "string?",
        "aiTags": "string[]",
        "sentiment": "positive | negative | neutral",
        "emotionScore": "number (0-1)",
        "aiCaption": "string?",
        "isLocked": "boolean",
        "unlockDate": "ISO date string?",
        "category": "string?",
        "createdAt": "ISO date string",
        "updatedAt": "ISO date string"
      }
    }
  ]
}
```

**Query Patterns**:
- Get all entries by userId (partition key query)
- Filter by date range
- Filter by type (photo/voice/text)
- Search by tags or keywords
- Sort by date (ascending/descending)

**Performance**:
- Partition key: `/userId` ensures efficient queries
- Indexed properties: `date`, `type`, `aiTags`
- TTL configured for soft-deleted entries

---

### 5. Storage Layer (Azure Blob Storage)

**Container Structure**:
```
timeline-media/
├── images/
│   ├── {userId}/{entryId}/original.jpg
│   └── {userId}/{entryId}/thumbnail.jpg
└── audio/
    └── {userId}/{entryId}/recording.mp3
```

**Upload Flow**:
```
1. Frontend requests upload URL from /api/upload
2. API generates SAS token for blob storage
3. Frontend uploads file directly to blob storage
4. After upload, frontend notifies API
5. API saves metadata to Cosmos DB
```

**Security**:
- SAS tokens with 24-hour expiry
- Private container with SAS access only
- CORS configured for web uploads

---

### 6. AI Layer (Azure Cognitive Services)

#### Computer Vision
**Purpose**: Analyze uploaded images

**Features**:
- Object detection and tagging
- Scene recognition
- Color analysis
- Text extraction (OCR)

**Example Output**:
```json
{
  "tags": ["beach", "sunset", "ocean", "vacation"],
  "confidence": 0.92,
  "description": "A beautiful sunset over the ocean"
}
```

#### Speech Services
**Purpose**: Transcribe audio entries

**Features**:
- Speech-to-text conversion
- Language detection
- Confidence scoring

**Example Output**:
```json
{
  "text": "Today was an amazing day. I went hiking...",
  "confidence": 0.89,
  "language": "en-US"
}
```

#### Text Analytics
**Purpose**: Analyze sentiment and extract insights

**Features**:
- Sentiment analysis (positive/negative/neutral)
- Key phrase extraction
- Entity recognition

**Example Output**:
```json
{
  "sentiment": "positive",
  "confidence": 0.95,
  "scores": {
    "positive": 0.95,
    "neutral": 0.04,
    "negative": 0.01
  },
  "keyPhrases": ["amazing day", "hiking", "beautiful views"]
}
```

---

## Data Flow

### Creating a New Entry

```
1. User fills out entry form (text/image/audio)
2. Frontend validates input
3. If media file:
   a. Request SAS token from /api/upload
   b. Upload file directly to Blob Storage
   c. Get blob URL
4. Call /api/entries with entry data
5. API route:
   a. Authenticates user (via middleware)
   b. If image: Call Computer Vision API for tags
   c. If audio: Call Speech API for transcription
   d. If text: Call Text Analytics for sentiment
   e. Save entry to Cosmos DB
6. Return success + entry ID to frontend
7. Frontend updates timeline view
```

### Fetching Timeline

```
1. User navigates to /timeline
2. Page component calls /api/entries
3. API route:
   a. Authenticates user
   b. Queries Cosmos DB with userId partition key
   c. Applies filters (date, type, tags)
   d. Sorts by date
4. Returns entries array
5. Frontend renders timeline cards
6. Images loaded from Blob Storage URLs
```

---

## Security Considerations

### Authentication
- OAuth 2.0 flow with Microsoft Entra ID
- JWT tokens with httpOnly cookies
- Token rotation and refresh
- CSRF protection

### Authorization
- User-specific data isolation via partition key
- API routes validate user ID matches token
- Middleware protects all authenticated routes

### Data Protection
- TLS/HTTPS for all connections
- Encrypted data at rest (Cosmos DB)
- SAS tokens for temporary blob access
- Environment variables for secrets

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)

---

## Scalability

### Horizontal Scaling
- **Frontend**: Azure Static Web Apps auto-scales
- **API**: Serverless functions scale automatically
- **Database**: Cosmos DB autoscale (400-4000 RU/s)
- **Storage**: Blob Storage handles unlimited files

### Performance Optimizations
- CDN for static assets
- Image optimization with Next.js Image component
- Lazy loading for timeline entries
- Pagination for large datasets
- caching for frequent queries

---

## Monitoring & Logging

### Application Insights
- Request tracking
- Error logging
- Performance metrics
- User analytics

### Cosmos DB Metrics
- Request units consumed
- Query performance
- Storage usage

### Blob Storage Metrics
- Upload/download speeds
- Storage capacity
- Request counts

---

## Cost Optimization

**Free Tier Usage**:
- Static Web Apps: 100GB bandwidth
- Cosmos DB: 1000 RU/s (autoscale to 400 RU/s minimum)
- Blob Storage: First 5GB free
- Cognitive Services: Limited free transactions

**Optimization Strategies**:
- Use cool storage tier for old media
- Implement data lifecycle policies
- Monitor and cap Cosmos DB RU/s
- Batch AI processing requests

---

## Disaster Recovery

### Backup Strategy
- **Cosmos DB**: Point-in-time restore enabled
- **Blob Storage**: Soft delete enabled (7 days)
- **GitHub**: Source code versioning

### Recovery Procedures
1. Restore Cosmos DB to point in time
2. Recover soft-deleted blobs
3. Redeploy from Git if needed

---

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Advanced search with AI
- [ ] Timeline sharing features
- [ ] Export to PDF/print
- [ ] Dark mode improvements
- [ ] Offline support (PWA)

---

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js | Full-stack framework, excellent DX, SEO-friendly |
| Azure Cosmos DB | Global distribution, NoSQL flexibility, autoscale |
| Azure Blob Storage | Cost-effective, scalable, SAS token support |
| TypeScript | Type safety, better IDE support, fewer bugs |
| Tailwind CSS | Rapid development, consistent design system |
| NextAuth.js | Easy OAuth integration, session management |

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Azure Cosmos DB Best Practices](https://docs.microsoft.com/azure/cosmos-db/best-practices)
- [Azure Cognitive Services Documentation](https://docs.microsoft.com/azure/cognitive-services/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
