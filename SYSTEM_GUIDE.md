# Asian College Padula 2026 — Tournament Management System Guide

Welcome to the official system guide for the **Asian College Padula Sports & Esports Tournament Management System** (React + TypeScript + Vite + Supabase).

---

## 1. Core Architectural Rule

> **CORE RULE:** The system may automatically decide **WHO PLAYS WHOM**. It may **NEVER** automatically decide **WHO WINS**.

- **Bracket Structure (No Automatic Seeding or Auto-Advancement):**
  - Generating single-elimination tournament brackets from registered teams of a sport (`generateBracket`).
  - Creating all tournament rounds (`Round of 16`, `Quarter-Finals`, `Semi-Finals`, `Championship Final`) with teams placed in registration order in Round 1 and all subsequent rounds (`Semi-Finals`, `Championship Final`) initialized to `'TBD'`.
  - No automatic seeding (`getSeedOrder` is not applied) and **no automatic BYE advancement** — no team is ever automatically placed into Semi-Finals or Finals.
  - Auto-assigning eligible, active Official Scorers of the same sport with load balancing and schedule clash detection.
  - Detecting venue and scorer time conflicts (`conflictWarning`).
- **Strictly Human Scorer Controlled (Scorekeeper Decides Advancement):**
  - Match scores (`scoreA`, `scoreB`), match winners (`winner`), and **which next-round match and slot (`Slot A` or `Slot B`) the winner advances to** come **exclusively** from the assigned human **Official Scorer** at the Scoring Desk (or an explicitly logged administrative override by the Sports Director / Coordinator).
  - Saving a live score updates the live scoreboard and bracket display in real time, but **never** advances a team until the scorer explicitly selects the target next-round slot and taps **"Finalize & Lock Match"** (or uses **"Place Winner in Slot"** / **"Scorekeeper Bracket Slot Assignment"** on the Scorer Desk).
  - Tied scores (`scoreA === scoreB`) and `0–0` scores cannot be finalized in knockout play.

---

## 2. User Roles & Permissions

| Role | Access Level & Responsibilities |
| :--- | :--- |
| **Sports Director** (`director`) | Full governance over all sports, events, venues, departments, staff accounts (`@asiancollege.edu.ph`), bracket generation/rebuilding, match reopening,logged score overrides, and full audit log inspection. |
| **Sports Coordinator** (`coordinator`) | Manages events, registers teams and players, assigns referees/scorers/venues, generates brackets, and reopens locked matches (if the next round match has not started). |
| **Official Scorer** (`scorer`) | Accesses the **Scorer Desk** (`ScorekeeperDashboard`) to start, score live, and finalize **only** the matches where `match.scorekeeper` matches their name. |
| **Public Visitor / Athlete** (`guest` / `player`) | Strictly **read-only** access to the Live Scoreboard, Symmetrical Brackets, Match Schedules, Standings, Medal Tally, Announcements, and AI Matchup Predictions. |

---

## 3. End-to-End Tournament Workflow

### Step 1: Configure Sports, Venues, Departments & Staff
1. Sign in as the **Sports Director** (`john.samane@asiancollege.edu.ph`).
2. Open **Event Setup** or **Officials Hub**:
   - Verify or add **Departments** (e.g., BAA, CSE, HTM, DPD, Senior Dept) and **Venues** (e.g., Main Arena Court 1, Pavilion Court, Esports Arena).
   - Register **Sports Coordinators** and **Official Scorers** using institutional `@asiancollege.edu.ph` emails.

### Step 2: Register Teams & Players
1. Open **Registration** (or use the **Tournament Setup Wizard**).
2. Register collegiate teams under their respective **Sport** and **Department**, and assign seed numbers if applicable.
3. Register athletes to their teams and verify medical clearance.

### Step 3: Generate the Tournament Bracket
1. Navigate to **Brackets & Scheduling** (`BracketPage`) or Step 5 of the **Setup Wizard**.
2. Select the target **Sport** from the sport selector dropdown/pills.
3. Click **⚡ Generate [Sport] Bracket** (or **🔄 Rebuild Bracket** to reset an existing bracket):
   - **Up to 8 teams:** Generates an 8-team bracket starting directly at **Quarter-Finals → Semi-Finals → Championship Final**.
   - **9 to 16 teams:** Generates a 16-team bracket starting at **Round of 16 → Quarter-Finals → Semi-Finals → Championship Final**.
   - Top seeds automatically receive `BYE`s when the team count is not an exact power of 2.

### Step 4: Live Scoring & Finalization at the Scorer Desk
1. Open the **Scorer Desk** (`ScorekeeperDashboard`).
2. Locate the scheduled match (both teams must be determined—matches with `TBD` placeholders stay locked until the previous round finishes).
3. Click **Start Match** to set the match status to `LIVE`.
4. Use the sport-specific scoring controls:
   - **Basketball:** `+1`, `+2`, `+3` points, quarter tracker (`Q1–Q4`, `OT`), and team fouls.
   - **Volleyball / Badminton / Table Tennis / Sepak Takraw:** Set/Game point tracker with automatic win-by-2 set advancement.
   - **Chess:** `1–0`, `0.5–0.5`, `0–1` result buttons.
   - **Esports (MLBB / Dota 2 / Valorant) & Field Sports:** Map/Goal counters.
5. Click **Finalize & Lock Match** once the game ends:
   - Confirm the final score in the confirmation dialog.
   - The system locks the match (`status: 'finished'`), records `finalizedBy` and `finalizedAt`, writes an immutable entry to the **Audit Log**, and automatically places the winning team into the linked next-round bracket slot (`nextMatchId` / `nextSlot`).

### Step 5: Reopening a Match (If Needed)
- If a score correction is required after finalization, a **Director** or **Coordinator** can click **Reopen Match** on the Scorer Desk **only if the next-round match has not yet started**.
- Reopening unlocks the match back to `live` and clears the advanced team from the next-round slot until re-finalized.

---

## 4. Key Source Files Reference

- **State & Core Rules:** [src/context/AppContext.tsx](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/context/AppContext.tsx)
- **Bracket Helpers (`isPlaceholder`, `getRoundName`, `getSeedOrder`):** [src/lib/bracket.ts](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/lib/bracket.ts)
- **Symmetrical Bracket Tree Component:** [src/components/TournamentTreeBracket.tsx](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/components/TournamentTreeBracket.tsx)
- **Brackets & Scheduling Page:** [src/pages/BracketPage.tsx](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/pages/BracketPage.tsx)
- **Official Scorer Desk:** [src/pages/ScorekeeperDashboard.tsx](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/pages/ScorekeeperDashboard.tsx)
- **Tournament Setup Wizard:** [src/pages/SetupWizardPage.tsx](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/pages/SetupWizardPage.tsx)
- **Public Portal & Live Scoreboard:** [src/pages/GuestPublicPage.tsx](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/pages/GuestPublicPage.tsx), [src/pages/LiveScoreboard.tsx](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/src/pages/LiveScoreboard.tsx)
- **Database Schema & RLS Policies:** [supabase_schema.sql](file:///c:/Users/ejeis/.gemini/antigravity-ide/scratch/padula/supabase_schema.sql)

