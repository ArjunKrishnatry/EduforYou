# Syllabus Analysis Dashboard App - Final Plan

## Overview
A desktop app (Electron + React) for students to upload/paste course syllabi, analyze them with AI, and view all assignments, exams, grades, and deadlines in a colorful consolidated dashboard.

---

## Target Audience
- **Primary users**: Students (non-technical)
- **Goal**: App should "just work" with minimal setup

---

## Tech Stack
| Component | Technology |
|-----------|------------|
| Framework | Electron + React + TypeScript |
| Build Tool | Vite + vite-plugin-electron |
| Styling | Tailwind CSS + Headless UI |
| State | Zustand |
| Calendar | FullCalendar |
| Charts | Recharts (grade pie chart, what-if sliders) |
| File Parsing | pdf-parse (PDF), mammoth (DOCX) |
| **LLM** | **Groq API (free tier)** |
| Storage | electron-store (local JSON) |
| Platforms | macOS, Windows, Linux |

---

## Core Features

### 1. Syllabus Input
- **Text paste** OR **file upload** (PDF/DOCX/TXT)
- **Merge multiple syllabi** into one course (e.g., main syllabus + lab schedule)
- Long syllabi (20+ pages): **process in chunks**, merge results
- Show extracted text preview before analysis

### 2. AI Analysis (Groq)
- Extract: assignments, exams, due dates, grade weights, materials, instructor info
- **All fields equally important** for accuracy
- Prep tips: **on-demand only** (button to generate when needed)
- Parse errors: **show error, ask to retry**
- **Flag potential duplicates** for user review

### 3. Semester Organization
- **Tabs per semester** (Fall 2026, Spring 2027, etc.)
- **Star a semester** to pin it to the main dashboard
- Ask for **semester start date** when creating each course
- Relative dates ("Week 5") estimated from semester start

### 4. Dashboard Views
- **Main dashboard**: Upcoming deadlines (1 week) + current grades per course
- Assignment list: sortable, filterable, expandable
- Calendar view: month/week/list with **per-course colors** (user picks)
- Grade weight breakdown: pie chart
- **Required materials list** (textbooks, resources)
- **Instructor info** (name, email, office hours)

### 5. Assignment Details
- Click opens **popup modal** with full details
- Track completion with **grade entry** (enter your actual grade received)
- Past deadlines: **gray out but keep visible**
- Editable: users can **edit any field** + **manually add assignments**

### 6. Grade Calculator
- Current grade based on completed assignments
- **What-if scenarios**: slider to project "If I get X% on final, my grade is..."
- Calculate final grade from weights

### 7. Calendar Integration
- **Export to .ics file** (manual import to any calendar)
- **Live Google Calendar sync** (OAuth integration)

### 8. Notifications
- **System notifications** (desktop alerts even when minimized)
- Content: "CS 101: Midterm (25% of grade) due in 2 days"
- Warning window: **1 week** ahead

### 9. Data Management
- **Local storage only** (no cloud sync)
- **Export**: JSON, CSV, and PDF report
- **Confirm before delete** courses
- Window state: **remember size + position**

### 10. System Tray
- **Tray icon when minimized**
- Quick access to upcoming deadlines

---

## UI/UX Specifications

### Visual Style
- **Todoist-like colorful dashboard** (vibrant, visual progress)
- **System preference** for light/dark mode (follows OS setting)
- Per-course color picking for calendar events

### Navigation
- Sidebar with course list + semester tabs
- **Basic keyboard shortcuts** (Cmd+N new course, Cmd+, settings)
- **No onboarding** - drop users directly into app

### Assignment View
- **Popup modal** when clicking assignment
- Shows: title, due date, weight, description, grade entry field

---

## Data Model

```typescript
interface Course {
  id: string;
  name: string;
  color: string;                    // User-selected color
  semesterId: string;               // Links to semester
  instructor: Instructor;
  assignments: Assignment[];
  gradeWeights: GradeWeight[];
  materials: Material[];
  rawSyllabusText: string;
  createdAt: string;
  updatedAt: string;
}

interface Semester {
  id: string;
  name: string;                     // "Fall 2026"
  startDate: string;                // For calculating "Week X" dates
  endDate?: string;
  isStarred: boolean;               // Pinned to dashboard
}

interface Instructor {
  name: string;
  email?: string;
  phone?: string;
  officeLocation?: string;
  officeHours?: { day: string; startTime: string; endTime: string; location?: string }[];
}

interface Assignment {
  id: string;
  title: string;
  type: 'exam' | 'midterm' | 'final' | 'quiz' | 'homework' | 'project' | 'paper' | 'lab' | 'other';
  dueDate?: string;                 // ISO date
  dueDateRaw?: string;              // Original text "Week 5"
  weight?: number;                  // Grade percentage
  description?: string;
  isCompleted: boolean;
  gradeReceived?: number;           // Actual grade user enters
  isPotentialDuplicate?: boolean;   // Flagged by AI
}

interface GradeWeight {
  category: string;                 // "Homework", "Exams"
  weight: number;                   // Percentage
  description?: string;
}

interface Material {
  id: string;
  type: 'textbook' | 'online_resource' | 'software' | 'equipment' | 'other';
  title: string;
  author?: string;
  isbn?: string;
  url?: string;
  isRequired: boolean;
}
```

---

## Project Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # App entry, window, tray
│   ├── preload.ts                 # IPC bridge
│   ├── ipc/
│   │   ├── file-handlers.ts       # Upload, parse PDF/DOCX
│   │   ├── llm-handlers.ts        # Groq API calls
│   │   ├── store-handlers.ts      # CRUD for courses/semesters
│   │   ├── calendar-handlers.ts   # Google Calendar OAuth + sync
│   │   └── notification-handlers.ts
│   └── services/
│       ├── parser/                # pdf-parse, mammoth
│       ├── llm/                   # Groq service + chunking
│       ├── store/                 # electron-store wrapper
│       ├── notifications/         # System notification scheduling
│       └── calendar/              # Google Calendar API
│
├── renderer/                      # React frontend
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Course list + semester tabs
│   │   │   ├── Header.tsx
│   │   │   └── Dashboard.tsx      # Main dashboard with starred semester
│   │   ├── input/
│   │   │   ├── SyllabusInput.tsx
│   │   │   ├── FileUploader.tsx   # Drag-drop, multi-file merge
│   │   │   └── TextPasteArea.tsx
│   │   ├── dashboard/
│   │   │   ├── CourseCard.tsx     # Shows grade + next deadline
│   │   │   ├── AssignmentList.tsx
│   │   │   ├── AssignmentModal.tsx # Popup with details + grade entry
│   │   │   ├── CalendarView.tsx
│   │   │   ├── GradeCalculator.tsx # Current + what-if scenarios
│   │   │   ├── WeightBreakdown.tsx
│   │   │   ├── MaterialsList.tsx   # Textbooks & resources
│   │   │   └── InstructorInfo.tsx  # Professor details
│   │   ├── semester/
│   │   │   ├── SemesterTabs.tsx
│   │   │   └── SemesterSettings.tsx # Start date, star toggle
│   │   ├── settings/
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── ApiKeyInput.tsx    # Groq API key
│   │   │   ├── GoogleCalendarConnect.tsx
│   │   │   └── CourseColorPicker.tsx
│   │   └── ui/                    # Reusable components
│   ├── store/                     # Zustand stores
│   │   ├── courseStore.ts
│   │   ├── semesterStore.ts
│   │   └── uiStore.ts
│   ├── hooks/
│   │   ├── useGradeCalculator.ts  # What-if logic
│   │   └── useNotifications.ts
│   └── types/
│
└── shared/
```

---

## Implementation Phases

### Phase 1: Foundation (3 days)
- [ ] Initialize Electron + React + Vite + TypeScript
- [ ] Configure Tailwind CSS with Todoist-inspired color palette
- [ ] Create window with remembered size/position
- [ ] Set up basic routing and layout (Sidebar, Content)
- [ ] Implement semester tabs + starring

### Phase 2: Input System (3 days)
- [ ] Build FileUploader with react-dropzone (multi-file)
- [ ] Build TextPasteArea
- [ ] Implement PDF/DOCX parsing
- [ ] Add chunking logic for long documents
- [ ] Create syllabus merge flow

### Phase 3: LLM Integration (4 days)
- [ ] Implement Groq service with free tier
- [ ] Build analysis prompt for structured extraction
- [ ] Add chunk processing and result merging
- [ ] Implement duplicate detection/flagging
- [ ] Add semester date prompt during course creation
- [ ] Calculate relative dates from semester start

### Phase 4: Data & Persistence (2 days)
- [ ] Configure electron-store for courses, semesters
- [ ] Implement CRUD operations
- [ ] Build Zustand stores with hydration
- [ ] Add export (JSON, CSV, PDF)

### Phase 5: Dashboard UI (6 days)
- [ ] Build main dashboard with deadlines + grades
- [ ] Create AssignmentList with sorting/filtering
- [ ] Implement AssignmentModal (popup) with grade entry
- [ ] Build CalendarView with per-course colors
- [ ] Create GradeCalculator with what-if sliders
- [ ] Add WeightBreakdown pie chart
- [ ] Build MaterialsList component
- [ ] Build InstructorInfo component

### Phase 6: Calendar & Notifications (3 days)
- [ ] Implement .ics export
- [ ] Add Google Calendar OAuth flow
- [ ] Build live sync functionality
- [ ] Implement system notifications
- [ ] Add tray icon with quick menu

### Phase 7: Polish (3 days)
- [ ] Add confirmation dialogs (delete)
- [ ] Implement keyboard shortcuts
- [ ] Handle errors gracefully
- [ ] Gray out past deadlines
- [ ] Final testing on all platforms

**Total: ~24 days**

---

## Key Dependencies

```json
{
  "electron": "^33.0.0",
  "react": "^18.3.0",
  "vite": "^6.0.0",
  "vite-plugin-electron": "^0.28.0",
  "groq-sdk": "^0.5.0",
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.8.0",
  "electron-store": "^10.0.0",
  "zustand": "^5.0.0",
  "@fullcalendar/react": "^6.1.15",
  "recharts": "^2.13.0",
  "tailwindcss": "^3.4.0",
  "zod": "^3.23.0",
  "googleapis": "^140.0.0",
  "ical-generator": "^8.0.0",
  "jspdf": "^2.5.0",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.460.0",
  "@headlessui/react": "^2.2.0",
  "react-dropzone": "^14.3.0"
}
```

---

## Setup Instructions

### Groq API Setup (Free Tier)

1. **Create Groq Account**
   - Go to https://console.groq.com/
   - Sign up with email or GitHub

2. **Generate API Key**
   - Navigate to API Keys section
   - Click "Create API Key"
   - Copy the key (starts with `gsk_`)

3. **Free Tier Limits**
   - 14,400 requests/day
   - 30 requests/minute
   - Good for ~50+ syllabus analyses per day

4. **In the App**
   - Open Settings (Cmd+,)
   - Paste your Groq API key
   - Key stored securely with electron safeStorage

### Google Calendar OAuth Setup

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create new project: "Syllabus Dashboard"

2. **Enable Google Calendar API**
   - Go to APIs & Services → Library
   - Search "Google Calendar API"
   - Click Enable

3. **Create OAuth Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: Desktop app
   - Name: "Syllabus Dashboard"
   - Download JSON credentials file

4. **Configure OAuth Consent Screen**
   - Go to OAuth consent screen
   - User type: External
   - App name: "Syllabus Dashboard"
   - Add scope: `https://www.googleapis.com/auth/calendar`
   - Add your email as test user

5. **In the App**
   - Place credentials JSON in app data folder (or)
   - Add Client ID/Secret in Settings
   - Click "Connect Google Calendar" → authorize in browser

---

## Verification Plan

1. **Input**: Test paste + multi-file upload with your sample syllabi
2. **Parsing**: Verify PDF/DOCX extraction, test chunking on 20+ page docs
3. **LLM**: Confirm Groq returns accurate structured data
4. **Duplicates**: Test flagging with overlapping syllabus content
5. **Grade Calculator**: Verify what-if scenarios calculate correctly
6. **Materials/Instructor**: Check these display correctly from syllabus
7. **Calendar**: Test .ics export imports correctly; test Google sync
8. **Notifications**: Verify system notifications appear on schedule
9. **Cross-platform**: Test on macOS, Windows, Linux
10. **Tray**: Verify tray icon appears when minimized

---

## Critical Considerations

| Concern | Mitigation |
|---------|------------|
| Groq rate limits | Implement exponential backoff; cache analyses |
| Google OAuth complexity | Start with .ics export; add Google sync as Phase 6 |
| PDF quality | Show extracted text preview; allow editing |
| System notifications | Request permission on first run (macOS) |
| Cross-platform tray | Use Electron's nativeImage for platform icons |
| What-if edge cases | Handle zero weights, all-complete, no grades |
| Multi-syllabus merge | Detect conflicts; let user resolve duplicates |
| Long syllabus chunking | Overlap chunks to preserve context |
