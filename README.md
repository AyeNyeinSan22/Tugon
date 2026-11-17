# Tugon — Your voice. Visible progress.

A community reporting platform for problems with public projects. Citizens can report issues like damaged roads, blocked drainage, unsafe construction, and unfinished projects — then follow visible updates as reports are reviewed.

> **Demonstration only.** Reports are not sent to government. Sample data is fictional.

## Features

- **Report a problem** — A guided 3-step flow to submit an issue with location, photos, and description
- **Road safety map** — Interactive Leaflet map centered on Batangas City with sample hazard markers and geolocation support
- **Track my report** — Look up report status by reference number
- **Public progress** — View and filter sample community reports by status
- **How it works** — Step-by-step guide with FAQ section
- **Bilingual (EN/FIL)** — Toggle between English and Filipino, persisted in localStorage

## Product views

### 1. Home

![Tugon home](public/features/1.png)

### 2. Step-by-step report process

The guided reporting flow takes citizens from picking a problem type to receiving a tracking ID.

#### Step 1 — Choose a problem type
Pick the closest match (damaged road, blocked drainage, unsafe construction, and more).

![Report step 1](public/features/2.png)

#### Step 2 — Add the location
Drop a map pin or enter a street and nearby landmark so the issue can be found.

![Report step 2](public/features/13.png)

#### Step 3 — Tell us more (details)
Add photos, describe what you noticed, and when you first saw it.

![Report step 3](public/features/3.png)

#### AI summary — Review your report
An AI-generated draft summarizes the report before submission. Government staff make every decision — the citizen can edit or confirm.

![AI summary](public/features/4.png)

#### Confirmation — Tracking ID
A tracking ID is issued so citizens can follow their report.

![Confirmation](public/features/5.png)

### 3. Track your report process

Enter the reference number you received after reporting, then follow the review timeline.

#### Search by reference
Look up a report using its tracking ID (e.g. `TG-99EZQN`).

![Track search](public/features/6.png)

#### Review timeline
See the report's progress — Report received → Under review → Office action — with its current status.

![Track timeline](public/track-report.png)

### 4. Public reports

![Public reports](public/public-reports.png)

### 5. Admin

![Tugon admin dashboard](public/admin.png)

## Feature walkthrough

### Citizen — Public site

#### Home
Landing page with hero, road safety overview map, process steps, and recently resolved cases.

![Home](public/features/1.png)

#### Track my report
Look up a report by reference number and see the review timeline.

![Track my report](public/features/6.png)

#### How it works
A 4-step explainer (choose → locate → describe → review) with FAQ.

![How it works](public/features/7.png)

### Staff workspace

#### Report queue
Prioritized queue with AI-suggested priority, project match, age, and status filters.

![Report queue](public/features/8.png)

#### Government projects & contracts
Registry of active/planned projects used for automated report matching and verification.

![Projects](public/features/9.png)

#### Grouped reports & public cases
Group citizen reports into verified public cases, record progress, and publish to the citizen portal.

![Grouped reports](public/features/10.png)

#### Post a public update
Set new status, write a plain-language citizen message, attach before/after evidence, and publish.

![Post a public update](public/features/11.png)

#### Audit & accountability log
Tamper-evident log of officer determinations, AI suggestion audits, and case updates.

![Audit log](public/features/12.png)

#### Report queue (alternate view)
Another view of the prioritized queue with different filters applied.

![Report queue alt](public/features/13.png)

## Team

| Member | Role |
|---|---|
| Charles | Team Leader |
| Ryan | UI/UX Designer |
| Bryan | Backend Developer |
| Yohan | AI/Data Analyst |
| San | Frontend Developer |

🌐 [weareteamtugon.vercel.app](https://weareteamtugon.vercel.app/)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.7 |
| Build | Vite |
| Styling | Tailwind CSS 4 |
| Maps | Leaflet + React Leaflet |
| Routing | React Router 7 |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/AyeNyeinSan22/Tugon.git
cd Tugon
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```
Tugon/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── tugon-mark.svg
└── src/
    ├── main.tsx              # Entry point
    ├── App.tsx               # Routing & page components
    ├── LanguageProvider.tsx   # EN/FIL i18n context
    ├── ReportFlow.tsx        # Multi-step report submission
    ├── RoadSafetyMap.tsx     # Interactive Leaflet map
    ├── FaqSection.tsx        # Accordion FAQ
    └── index.css             # Global styles & Tailwind
```

## Pages

| Route | Description |
|---|---|
| `/` | Home page with hero, map, categories, how-it-works, FAQ |
| `/report` | 3-step report flow (Problem → Location → Details) |
| `/track` | Report lookup by reference number |
| `/progress` | Filterable public progress list |
| `/how-it-works` | Detailed guide + FAQ |

## Categories

- **Damaged road** — Potholes, cracks, sinking surface
- **Blocked drainage** — Clogged canals, flooding spots
- **Unfinished project** — Work stopped or abandoned
- **Unsafe construction** — Open pits, no barriers or signs
- **Broken walkway or bridge** — Hard or unsafe to cross
- **Something else** — Tell us in your own words

## License

MIT
