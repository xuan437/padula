# Asian College Padula 2026 — Tournament Management System Guide

Welcome to the official system guide for the **Asian College Padula 2026 Sports & Esports Tournament Management System** (React + TypeScript + Vite + Supabase).

---

## 1. Core Architectural Rule

> **CORE RULE:** The system may automatically decide **WHO PLAYS WHOM**. It may **NEVER** automatically decide **WHO WINS**.

- **Bracket Structure & Auto-Slot Sync:**
  - Single-elimination tournament brackets are generated from registered teams of a sport (`generateBracket`), supporting 4-team, 8-team, and 16-team trees.
  - All tournament rounds (`Round of 16`, `Quarter-Finals`, `Semi-Finals`, `Championship Final`) initialize next-round slots to `'TBD'` until completed by a human scorer.
  - **Official Match Play Sequence:** Every bracket displays a deterministic, collision-free play sequence (`Match #1` → `Championship Final`) with status badges (`▶ PLAY NEXT`, `● LIVE`, `✓ FINAL`, `QUEUED`).
  - Newly registered teams in the **Registration Desk** automatically sync into open bracket slots (`Slot A` / `Slot B`) in the Scorer Desk.
  - Eligible, active Official Scorers of the same sport are auto-assigned with load balancing and venue/scorer conflict detection (`conflictWarning`).
- **Strictly Human Scorer Controlled (Scorekeeper Decides Advancement):**
  - Match scores (`scoreA`, `scoreB`), match winners (`winner`), and **which next-round match and slot (`Slot A` or `Slot B`) the winner advances to** come **exclusively** from the assigned human **Official Scorer** at the Scorer Desk (or an explicitly logged administrative override by the Sports Director / Coordinator).
  - Saving a live score updates the live scoreboard and bracket display in real time, but **never** advances a team until the scorer explicitly selects the target next-round slot and taps **"Finalize & Lock Match"** (or uses **"Place Winner in Slot"** / **"Scorekeeper Bracket Slot Assignment"** on the Scorer Desk).
  - Tied scores (`scoreA === scoreB`) and `0–0` scores cannot be finalized in knockout play.

---

## 2. User Roles & Permissions

| Role | Access Level & Responsibilities |
| :--- | :--- |
| **Sports Director** (`director`) | Full governance over all sports, events, venues, departments, staff accounts (`@asiancollege.edu.ph`), access request approvals, bracket generation/rebuilding, match reopening, logged score overrides, and full audit log inspection. |
| **Sports Coordinator** (`coordinator`) | Manages events, registers teams and players, assigns referees/scorers/venues, generates brackets, and reopens locked matches (if the next-round match has not started). |
| **Official Scorer** (`scorer`) | Accesses the **Scorer Desk** (`ScorekeeperDashboard`) to start, score live, and finalize matches (assigned matches for standard scorers; all available matches for authorized/demo scorers). |
| **Public Visitor / Athlete** (`guest` / `player`) | Strictly **read-only** access to the Public Portal (`GuestPublicPage`), including the Arena LED Clock, Floating Department Cards, Live Scoreboard, Symmetrical Brackets, Match Schedules, Standings, Medal Tally, Announcements, and Matchup Predictions. |

---

## 3. End-to-End Tournament Workflow

### Step 1: Configure Sports, Venues, Departments & Staff
1. Sign in as the **Sports Director** (`john.samane@asiancollege.edu.ph`).
2. Use the **Quick Actions Toolbar** on the **Admin Dashboard** (`Setup Wizard`, `Officials Hub`, `Add Sport`, `Add Venue`, `Add Coordinator`, `Post Announcement`) or **Access Requests** to approve coordinator/scorer applications.
3. Verify **Departments** (BAA Falcons, CSE Titans, HTM Chefs, DPD Strikers, Senior Dept / SHS) and **Venues** (e.g., Main Arena Court 1 & 2, Pavilion Court, Fieldhouse Annex, Esports Arena, Chess Hall).

### Step 2: Register Teams & Players (Registration Desk)
1. Open the **Registration Desk** (`RegistrationPage`) or use the **Tournament Setup Wizard**.
2. Register collegiate teams under their respective **Sport** and **Department**; teams automatically sync to open **Scorer Desk Slots**.
3. Register athletes using the **Register Player** form:
   - Select the player's **Department**, **Sport**, and **Team** (automatically filtered to matching teams).
   - Enter Full Name, Student ID, Jersey Number, Position, institutional Gmail (`@asiancollege.edu.ph`), and verify Medical Clearance.
4. Click **View Players** in the **Registered Teams** table to inspect inline team rosters or open the full roster modal.

### Step 3: Generate & View Tournament Brackets
1. Navigate to **Brackets & Scheduling** (`BracketPage`) or Step 5 of the **Setup Wizard**.
2. Select the target **Sport** and **Tournament Format**.
3. Click **⚡ Generate [Sport] Bracket** (or **🔄 Rebuild Bracket** to reset an existing bracket):
   - **Up to 4 teams:** Starts at **Semi-Finals → Championship Final**.
   - **5 to 8 teams:** Starts at **Quarter-Finals → Semi-Finals → Championship Final**.
   - **9 to 16 teams:** Starts at **Round of 16 → Quarter-Finals → Semi-Finals → Championship Final**.
4. Review the **Official Match Play Sequence** grid below the bracket tree to see exact match order (`Match #1` onward) and the highlighted `▶ PLAY NEXT` match.

### Step 4: Live Scoring & Finalization at the Scorer Desk
1. Open the **Scorer Desk** (`ScorekeeperDashboard`) and filter by sport if needed.
2. Locate the scheduled match (both teams must be determined—matches with `TBD` placeholders stay locked until the previous round finishes).
3. Click **Start Match** to set the match status to `LIVE`.
4. Use the sport-specific scoring controls:
   - **Basketball:** `+1`, `+2`, `+3` points, quarter tracker (`Q1–Q4`, `OT`), and team fouls.
   - **Volleyball / Badminton / Table Tennis / Sepak Takraw:** Set/Game point tracker with automatic win-by-2 set advancement.
   - **Chess:** `1–0`, `0.5–0.5`, `0–1` result buttons.
   - **Esports (MLBB / Dota 2 / Valorant) & Field Sports:** Map/Goal counters.
5. Click **Finalize & Lock Match** once the game ends:
   - Confirm the final score in the confirmation dialog.
   - The system locks the match (`status: 'finished'`), records `finalizedBy` and `finalizedAt`, writes an immutable entry to the **Audit Log**, and places the winning team into the linked next-round bracket slot (`nextMatchId` / `nextSlot`).

### Step 5: Reopening a Match (If Needed)
- If a score correction is required after finalization, a **Director** or **Coordinator** can click **Reopen Match** on the Scorer Desk **only if the next-round match has not yet started**.
- Reopening unlocks the match back to `live` and clears the advanced team from the next-round slot until re-finalized.

---

## 4. Public Portal Features (`GuestPublicPage`)

- **Arena Digital LED Clock (`DigitalLedClock`):** 7-segment LED clock displaying live Dumaguete City (PST) time, 12/24-hour format toggle, day-of-week indicator, venue temperature, and date.
- **Floating Department Cards (`FloatingDepartmentCards`):** Animated department cards styled in each department's official logo colors (BAA Gold, CSE Purple, HTM Crimson, DPD Emerald, SHS Royal Blue). Clicking a card filters public matches and standings by that department.
- **Live Sync, Light/Dark Theme, Share/QR & Print:** One-click theme toggle, QR code sharing, and print-ready tournament views.

---

## 5. Key Source Files Reference

- **State & Core Rules:** `src/context/AppContext.tsx`
- **Bracket Helpers (`isPlaceholder`, `getRoundName`, `getSeedOrder`):** `src/lib/bracket.ts`
- **Symmetrical Bracket Tree & Play Sequence:** `src/components/TournamentTreeBracket.tsx`
- **Arena LED Clock:** `src/components/DigitalLedClock.tsx`
- **Floating Department Cards:** `src/components/FloatingDepartmentCards.tsx`
- **Admin Dashboard & Access Requests:** `src/pages/AdminDashboard.tsx`
- **Registration Desk (Teams & Players):** `src/pages/RegistrationPage.tsx`
- **Brackets & Scheduling Page:** `src/pages/BracketPage.tsx`
- **Official Scorer Desk:** `src/pages/ScorekeeperDashboard.tsx`
- **Tournament Setup Wizard:** `src/pages/SetupWizardPage.tsx`
- **Public Portal & Live Scoreboard:** `src/pages/GuestPublicPage.tsx`, `src/pages/LiveScoreboard.tsx`
- **Database Schema & RLS Policies:** `supabase_schema.sql`
