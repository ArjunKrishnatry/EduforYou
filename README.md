# Syllabus Dashboard

A desktop application that helps students manage their courses by analyzing syllabi with AI and tracking assignments, grades, and deadlines.

![Electron](https://img.shields.io/badge/Electron-40-blue)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-ISC-green)

## Features

- **AI-Powered Syllabus Analysis**: Upload PDF/DOCX syllabi or paste text, and AI extracts assignments, exams, due dates, grade weights, and materials
- **Multi-Course Management**: Organize courses by semester with tabs and starring
- **Grade Calculator**: Track your grades with what-if scenarios (coming soon)
- **Calendar View**: See all deadlines in a visual calendar (coming soon)
- **System Notifications**: Get reminded of upcoming deadlines (coming soon)
- **Google Calendar Sync**: Export to .ics or sync live with Google Calendar (coming soon)
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Groq API Key](https://console.groq.com/) (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/syllabus-dashboard.git
cd syllabus-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Configure your Groq API key:
   - Click **Settings** in the sidebar
   - Enter your Groq API key (get one free at [console.groq.com](https://console.groq.com/))
   - Click **Test Connection** to verify

### Usage

1. **Add a Semester**: Click "Add Semester" in the tab bar, enter the name and start date
2. **Star a Semester**: Click the star icon on a semester tab to pin it to the dashboard
3. **Add a Course**: Click "Add Course" in the header
4. **Upload Syllabus**: Drag & drop a PDF/DOCX file, or paste the syllabus text
5. **Analyze**: Click "Analyze Syllabus" to extract assignments and details

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Electron + React + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| LLM | Groq API (Llama 3.3 70B) |
| File Parsing | pdf-parse, mammoth |

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # App entry point
│   ├── preload.ts           # IPC bridge
│   ├── ipc/                 # IPC handlers
│   └── services/            # Backend services
│       ├── parser/          # PDF/DOCX parsing
│       ├── llm/             # Groq API integration
│       └── store/           # Settings & data
│
├── renderer/                # React frontend
│   ├── components/          # UI components
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript types
│
└── shared/                  # Shared types/constants
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Groq API (Free Tier)

This app uses [Groq](https://groq.com/) for AI-powered syllabus analysis. The free tier includes:

- 14,400 requests per day
- 30 requests per minute
- Enough for ~50+ syllabus analyses per day

### Getting Your API Key

1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key (starts with `gsk_`)
5. Paste it in the app's Settings

## Roadmap

- [x] Phase 1: Foundation (Electron + React + Layout)
- [x] Phase 2: Input System (File upload, text paste, parsing)
- [x] Phase 3: LLM Integration (Groq API, syllabus analysis)
- [ ] Phase 4: Data Persistence (Save courses, assignments)
- [ ] Phase 5: Dashboard UI (Assignment list, calendar, grades)
- [ ] Phase 6: Calendar & Notifications
- [ ] Phase 7: Polish & Distribution

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Groq](https://groq.com/) for the fast, free LLM API
- [Electron](https://electronjs.org/) for cross-platform desktop apps
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
