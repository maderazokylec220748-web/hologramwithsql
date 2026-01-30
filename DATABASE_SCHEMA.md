# 📊 WIS AI Hologram - Database Schema & Architecture

## 🔗 **Database Connection Flow**

```
.env (DATABASE_URL)
    ↓
server/db.ts (MySQL Pool + Drizzle ORM)
    ↓
shared/schema.ts (Table Definitions)
    ↓
server/storage.ts (Data Access Layer)
    ↓
server/grok.ts (AI Context Builder)
    ↓
server/routes.ts (API Endpoints)
```

---

## 📋 **Database Configuration**

**File:** [server/db.ts](server/db.ts)

```typescript
DATABASE_URL=mysql://root:@localhost:3306/hologram

Connection Settings:
- Connection Pool: 10 max connections
- Keep Alive: Enabled (60s timeout)
- Queue Limit: Unlimited
- Timezone: Local
```

---

## 🗂️ **Core Tables & Relationships**

### 1️⃣ **FAQs Table** (Frequently Asked Questions)
**File:** [migrations/0001_create_tables.sql](migrations/0001_create_tables.sql)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | VARCHAR(36) PRIMARY KEY | Unique identifier |
| `question` | TEXT | FAQ question (user searchable) |
| `answer` | TEXT | FAQ answer (AI responses) |
| `category` | TEXT | admissions, academic, campus, scholarships |
| `priority` | INT | Higher = shown first (0-10) |
| `is_active` | BOOLEAN | true = visible to AI, false = hidden |
| `created_at` | TIMESTAMP | When created |
| `updated_at` | TIMESTAMP | When last modified |

**Indexed on:** priority (for sorting)

**Example Data:**
```
Q: "How do I enroll at Westmead?"
A: "Enrollment at Westmead International School is simple and straightforward. You can enroll online..."
Category: admissions
Priority: 10 (high)
Active: true
```

✅ **AI Can Find:** "enroll", "apply", "registration", "admission"

---

### 2️⃣ **Professors Table** (Faculty & Staff)
**File:** [migrations/0005_add_professors_facilities.sql](migrations/0005_add_professors_facilities.sql)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | VARCHAR(36) PRIMARY KEY | Unique identifier |
| `fullName` | VARCHAR(255) | Professor's full name |
| `position` | VARCHAR(255) | Job title (President, Dean, Professor, etc.) |
| `department` | VARCHAR(255) | Department/College assignment |
| `email` | VARCHAR(255) | Contact email |
| `phone` | VARCHAR(20) | Contact phone |
| `description` | TEXT | Bio/description |
| `createdAt` | TIMESTAMP | When created |
| `updatedAt` | TIMESTAMP | When last modified |

**Indexed on:** fullName, position, department

**Current Data (7 Faculty Members):**
```
1. Dr. Arlene D. Castor | President & CEO | Mathematics
2. Dr. Marites D. Manlongat | Vice President for Academic Affairs | SEBA/CAS
3. Iluminada De Chavez | Chairman of the Board | Board of Trustees
4. Mr. John Andrew C. Manalo | Professor | CITCS
5. Mr. Roberto Fernandez | Instructor | Arts & Design
6. Prof. Ernesto Carlo L. De Chavez | Dean | CTHM
7. Prof. Rosana De Chavez | CITCS Dean | CITCS
```

✅ **AI Can Find:** "president", "dean", "professor", "faculty", "staff"

---

### 3️⃣ **Facilities Table** (Campus Resources)
**File:** [migrations/0005_add_professors_facilities.sql](migrations/0005_add_professors_facilities.sql)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | VARCHAR(36) PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(255) | Facility name |
| `type` | VARCHAR(255) | Library, Laboratory, Sports, etc. |
| `location` | VARCHAR(255) | Building/location on campus |
| `capacity` | INT | How many people it can hold |
| `status` | ENUM | active, inactive, maintenance |
| `description` | TEXT | Full description |
| `createdAt` | TIMESTAMP | When created |
| `updatedAt` | TIMESTAMP | When last modified |

**Indexed on:** name, type, location, status

**Example Facilities (7 Total):**
```
1. Main Library | Library | Building A, Ground Floor | Capacity: 150
2. Science Laboratory Complex | Laboratory | Building B, 2nd Floor | Capacity: 40
3. Sports Complex | Sports Facility | Outdoor Area, East Campus | Capacity: 500
4. Computer Lab 1 | Technology Lab | Building C, 1st Floor | Capacity: 35
5. Auditorium | Event Space | Building D | Capacity: 800
6. Art Studio | Creative Space | Building A, 3rd Floor | Capacity: 50
7. Cafeteria | Dining Facility | Building A, Basement | Capacity: 300
```

✅ **AI Can Find:** "library", "lab", "gym", "building", "campus", "facility"

---

### 4️⃣ **Events Table** (School Events & Announcements)
**File:** [migrations/0006_add_events.sql](migrations/0006_add_events.sql)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | VARCHAR(36) PRIMARY KEY | Unique identifier |
| `title` | VARCHAR(255) | Event name |
| `description` | TEXT | Full event description |
| `event_date` | TIMESTAMP | When event happens |
| `event_end_date` | TIMESTAMP | End time (if multi-day) |
| `location` | VARCHAR(255) | Where event takes place |
| `department` | VARCHAR(255) | Department organizing it |
| `organizer` | VARCHAR(255) | Person/group organizing |
| `event_type` | VARCHAR(100) | academic, sports, cultural, etc. |
| `is_active` | BOOLEAN | true = visible to AI |
| `createdAt` | TIMESTAMP | When created |
| `updatedAt` | TIMESTAMP | When last modified |

**Indexed on:** event_date, event_type, is_active, department

✅ **AI Can Find:** "event", "schedule", "activity", "when", "upcoming"

---

### 5️⃣ **Queries Table** (Chat History)
**File:** [migrations/0001_create_tables.sql](migrations/0001_create_tables.sql)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | VARCHAR(36) PRIMARY KEY | Unique identifier |
| `question` | TEXT | User's question |
| `answer` | TEXT | AI's answer |
| `user_type` | TEXT | visitor, student, parent |
| `category` | TEXT | Topic category |
| `response_time` | INT | How long AI took (ms) |
| `created_at` | TIMESTAMP | When query was made |

**Purpose:** Analytics and tracking user interactions

---

### 6️⃣ **Analytics Events Table** (Tracking)
**File:** [migrations/0003_analytics_tables.sql](migrations/0003_analytics_tables.sql)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | VARCHAR(36) PRIMARY KEY | Unique identifier |
| `event_type` | TEXT | chat_query, feedback, interaction |
| `event_data` | TEXT | JSON data about event |
| `session_id` | VARCHAR(36) | User's session |
| `user_type` | TEXT | visitor, student, parent |
| `created_at` | TIMESTAMP | When event occurred |

---

## 🔄 **Data Access Layer**

**File:** [server/storage.ts](server/storage.ts)

The storage layer provides clean abstractions for all database operations:

```typescript
// FAQs
getAllFaqs() → Returns all FAQs sorted by priority
getActiveFaqs() → Returns only active FAQs
createFaq() → Adds new FAQ

// Professors
getAllProfessors() → Returns all faculty/staff
getProfessorById() → Gets specific professor
createProfessor() → Adds new professor

// Facilities
getAllFacilities() → Returns all facilities
getFacilityById() → Gets specific facility

// Events
getAllEvents() → Returns all events
getActiveEvents() → Returns only active events
getUpcomingEvents() → Returns future events
```

✅ All methods include logging for debugging

---

## 🧠 **AI Context Builder**

**File:** [server/grok.ts](server/grok.ts)

The AI uses `buildDatabaseContext()` to fetch relevant data:

```typescript
function buildDatabaseContext(question, faqs, professors, facilities, events) {
  // 1. Check question keywords
  if (question includes 'professor'/'president'/'dean') 
    → Include ALL professors
  
  if (question includes 'facility'/'library'/'lab')
    → Include ALL facilities
  
  if (question includes 'event'/'when'/'schedule')
    → Include ALL events
  
  // 2. Search FAQs for matching keywords
  if (question includes 'enroll'/'apply'/'admission')
    → Include matching FAQs
  
  // 3. Build formatted context for AI
  return formatted_database_content
}
```

---

## 🔍 **Keyword Matching for AI**

**File:** [server/grok.ts](server/grok.ts) - Lines 125-140

```typescript
const topicKeywords = {
  professor: [
    'professor', 'faculty', 'staff', 'teacher', 'instructor',
    'head', 'dean', 'director', 'who is', 'contact',
    'president', 'ceo', 'chairman', 'vice president', 'vp'
  ],
  facility: [
    'facility', 'facilities', 'building', 'library', 'lab',
    'gym', 'classroom', 'office', 'campus', 'where'
  ],
  event: [
    'event', 'events', 'upcoming', 'schedule', 'activity',
    'activities', 'competition', 'when'
  ],
  admission: [
    'admission', 'enroll', 'apply', 'entry', 'exam',
    'requirement', 'registration', 'how to'
  ],
  scholarship: [
    'scholarship', 'tuition', 'financial', 'aid',
    'discount', 'grant', 'fee', 'cost'
  ]
};
```

✅ **FAQ Matching Algorithm (Improved):**
```typescript
if (question has 'enroll' keyword) {
  Search FAQs for: 'apply' OR 'enroll' OR 'admission' OR 'registration'
  → Matches "How do I apply?" AND "How do I enroll?"
}
```

---

## 📡 **API Endpoints (server/routes.ts)**

```typescript
POST /api/chat
  Input: { question: string }
  Output: { answer: string, category: string }
  Process:
    1. Check cache (avoid duplicate queries)
    2. Load database context
    3. Call Ollama AI with context + question
    4. Return answer + save to database

POST /api/chat-stream
  Input: { question: string }
  Output: Streamed tokens (real-time response)
  
DELETE /api/chat/clear
  Clears response cache

GET /api/school-data
  Returns: { faqs, professors, facilities, events }
```

---

## 🗄️ **Migration Files (Executed in Order)**

| File | Purpose | Tables Created |
|------|---------|-----------------|
| `0001_create_tables.sql` | Initial setup | admin_users, queries, faqs, chat_history |
| `0002_seed_data.sql` | Sample data | (if any) |
| `0003_analytics_tables.sql` | Analytics | analytics_events, feedback |
| `0005_add_professors_facilities.sql` | Faculty & Campus | professors, facilities |
| `0006_add_events.sql` | Events | events |

---

## ✅ **Verification Checklist**

- [x] Database URL configured in `.env`
- [x] Drizzle ORM connected to MySQL pool
- [x] All 7 tables created with proper indexes
- [x] Storage layer provides CRUD operations
- [x] Keywords properly defined for AI matching
- [x] FAQ matching handles synonyms (enroll = apply)
- [x] Professors table has 7 faculty members
- [x] Facilities table has 7 campus resources
- [x] Events table stores upcoming activities
- [x] AI context builder fetches relevant data
- [x] Logging enabled for debugging

---

## 🚀 **How AI Finds Answers**

**Example: "How do I enroll at Westmead?"**

```
1. Question received: "How do I enroll at Westmead?"
   ↓
2. Keyword detection: "enroll" detected → admission keyword
   ↓
3. FAQ search: Find FAQs matching admission keywords
   ↓
4. Results found:
   - FAQ: "How do I apply to Westmead..." (matches "apply")
   - FAQ: "How do I enroll at Westmead..." (exact match)
   - FAQ: "What is the enrollment procedure?" (matches "enroll")
   ↓
5. Context built with matching FAQs
   ↓
6. Ollama AI (llama3.2:3b) receives context + question
   ↓
7. AI generates answer from database FAQs
   ↓
8. Response: "Enrollment at Westmead International School is..."
   ↓
9. Query saved to database for analytics
```

---

## 🔐 **Data Integrity**

- ✅ All IDs are UUID (prevents collisions)
- ✅ Timestamps auto-updated
- ✅ Foreign keys not required (flexible schema)
- ✅ Indexes on frequently searched columns
- ✅ Active/inactive flags for content control
- ✅ Priority system for FAQ sorting

---

## 📝 **Notes**

- Database must be running before server starts
- All tables auto-create on first run
- Drizzle ORM handles migrations automatically
- Storage layer logs all operations for debugging
- AI uses grounded generation (only answers from database)
- Cache prevents duplicate AI calls within 1 hour
