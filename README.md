## Game Design Document: Author's Journey

### 1. Game Concept

**Author's Journey** is an incremental game where the player takes on the role of a budding author, starting from the age of 18. The ultimate goal is to write a bestseller. The player must balance working odd jobs to pay for living expenses and equipment with honing their writing skills and dedicating time to their manuscript. The game ends at the mandatory retirement age of 70 (which can be extended), at which point the player can "retire," resetting their progress but gaining powerful permanent bonuses for their next life, making each attempt to write a masterpiece more achievable.

### 2. Core Gameplay Loop & Formulas

#### **Time & Age**
*   The game runs at a base speed of **4 game days per second**.
*   **Age:** Starts at 18 years (6570 days).
*   **Lifespan:** Your base lifespan is 70 years (25,550 days). This can be extended by late-game skills like *Healthy Lifestyle* and *Longevity Secrets*.
*   **Retirement:** You are forced to retire if your age exceeds your lifespan.

#### **Tasks (Jobs & Skills)**
All Jobs and Skills are "Tasks" and share these core formulas:
*   **Max XP for next level:** `round(BaseMaxXP * (CurrentLevel + 1) * 1.01 ^ CurrentLevel)`
*   **XP Gain:** The base XP gain is 10/sec, which is then modified by all applicable multipliers.

#### **Core Resources & Formulas**
*   **Money ($):** Earned from your active job. Expenses are the sum of your housing and equipment costs. If your balance drops below zero, you become Homeless and lose all your equipment.
*   **Inspiration (Happiness):** A direct multiplier to **all XP gain** and writing speed.
    *   **Formula:** `(Meditation Effect) * (Equipment Effects) * (Current Housing Effect)`
*   **Fame:** The second-tier prestige currency. Earned from retiring after the "Fame" mechanic is unlocked. It provides a global multiplier to book sales and is used to level up *The Business of Writing* skills.
    *   **Formula for Fame Gain per Retirement:** `(Networking Effect) * (Media Tours Effect)`

### 3. The Writing Process (Central UI Panel)

This is the core mechanic, always visible and progressing.

*   **Writing Speed (Words/day):** This is calculated automatically.
    *   **Base Speed:** A small, constant value.
    *   **Multipliers:** `(Typing Speed Skill Effect * Focus Skill Effect * Equipment Bonus * Inspiration)`.
    *   **Full-Time Author Bonus:** If the player's current job is "Full-Time Author," Writing Speed gets a x5 multiplier.
*   **Book Length (Pages):** The target length of the current book, determined by the level of the "Plotting" skill. (e.g., `50 + (Plotting Level * 2)` pages).
*   **Book Quality:** Starts at 0% for each new book. It increases as the player gains levels in any skill from the "Writing Craft" category. The final quality is the average contribution from these skills.
*   **Publishing:** When "Words Written" reaches the target, the book is published.
    *   **Sales Calculation:** `Initial Sales = (Quality / 100) * (Fame + 10) * Base_Sales_Factor`.
    *   **Royalties:** A small percentage of the initial sales value is added to the daily passive "Royalties" income.
    *   A new, slightly longer book is automatically started.

---

### 4. Jobs (The "Work" Tab)

Jobs provide your main source of income.

| Category | Job Name | Base Max XP | Base Income/day | Description & Unlock Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Menial Work**| Gig Worker | 50 | $0.05 | *Struggle day and night for a couple of dollars. It feels like you are at the brink of burnout each day.* <br/> **Req:** Unlocked by default. |
| | Food Service | 100 | $0.09 | *Serve coffee and food to grumpy customers. It's not much but it's honest work.* <br/> **Req:** Gig Worker Level 10. |
| | Delivery Driver | 200 | $0.15 | *Deliver packages around the city. A relaxing but still a poor paying job.* <br/> **Req:** Food Service Level 10. |
| | Warehouse Worker | 400 | $0.40 | *Lift heavy boxes in a massive warehouse. The pay is quite meager compared to the physical toll.* <br/> **Req:** Delivery Driver Level 10, **Focus** Level 10. |
| | Office Temp | 800 | $0.80 | *File papers and make copies. A respectable and OK paying entry-level job.* <br/> **Req:** Warehouse Worker Level 10, **Focus** Level 30. |
| | Personal Assistant| 1,600 | $1.50 | *Manage a busy executive's schedule. The job pays decently well and is a lot less manually-intensive.* <br/> **Req:** Office Temp Level 10, **Frugality** Level 50. |
| **Creative Industry** | Intern | 100 | $0.05 | *Fetch coffee and run errands at a small publishing house. Very meager pay but the work experience is quite valuable.* <br/> **Req:** **Focus** Level 5. |
| | Blogger | 1,000 | $0.50 | *Write articles for an online publication. A creative, respectable job but you are still unknown in the grand scheme of things.* <br/> **Req:** Intern Level 10, **Typing Speed** Level 20. |
| | Content Creator | 10,000 | $1.20 | *More experienced than the average blogger, you create engaging content for a growing audience. The pay is not that bad.* <br/> **Req:** Blogger Level 10, **Grammar & Prose** Level 40. |
| | Copy Editor | 100,000 | $3.00 | *Proofread and polish manuscripts for other authors. A decently paying and very respectable job in the industry.* <br/> **Req:** Content Creator Level 10, **Typing Speed** Level 100. |
| | Staff Writer | 1,000,000 | $10.00 | *Utilising your unmatched writing ability, you produce high-quality articles on tight deadlines. Most bloggers never acquire such a well paying job.* <br/> **Req:** Copy Editor Level 10, **Grammar & Prose** Level 150. |
| | Senior Editor | 7,500,000 | $30.00 | *Obliterate weak prose and plot holes in manuscripts with extraordinary proficiency. Such a feared editor is paid extremely well.* <br/> **Req:** Staff Writer Level 10, **Typing Speed** Level 300. |
| | Ghostwriter | 40,000,000 | $150.00 | *Write entire books for famous clients under strict non-disclosure agreements. The few who attain this level of skill are showered with money.* <br/> **Req:** Senior Editor Level 10, **Plotting** Level 500. |
| | Full-Time Author | 150,000,000| $0 | *You've made it. Quit your day job to focus entirely on your masterpiece. No income, but provides a **x5 multiplier to Writing Speed**.* <br/> **Req:** Ghostwriter Level 10, **Plotting** Level 1000, **Grammar & Prose** Level 1000. |
| **Literary Elite** | C.W. Student | 100,000 | $1.00 | *Study the theory of literature and practice creative writing exercises. There is minor pay to cover living costs.* <br/> **Req:** **Focus** Level 200, **Meditation** Level 200. |
| | Junior Agent | 1,000,000 | $10.00 | *Under the supervision of a Senior Agent, you discover new talent and negotiate small deals. Generous pay will be provided.* <br/> **Req:** C.W. Student Level 10, **Plotting** Level 400. |
| | Senior Agent | 10,000,000 | $75.00 | *Turn the tides of an author's career by securing major publishing deals and mentoring other agents. The pay for this job is extremely high.* <br/> **Req:** Junior Agent Level 10, **Plotting** Level 700. |
| | Publisher | 100,000,000 | $500.00 | *Utilise your vast network to acquire and publish books that shape the cultural landscape. Only a small percentage of agents attain this role.* <br/> **Req:** Senior Agent Level 10, **Plotting** Level 1000. |
| | Literary Titan | 10,000,000,000| $2,500.00 | *Blessed with unparalleled talent, you can spot a bestseller from a mile away. It is said that a titan can make or break an entire genre.* <br/> **Req:** Publisher Level 10, **Plotting** Level 1500. |
| | Head of Publishing | 1,000,000,000,000| $10,000.00 | *Spend your days administrating a global publishing empire and searching for the next literary movement. The Head receives ludicrous amounts of pay daily.* <br/> **Req:** Literary Titan Level 10, **Plotting** Level 2000. |

---

### 5. Skills (The "Skills" Tab)

Skills provide passive bonuses.

| Category | Skill Name | Base Max XP | Effect Logic & Description | Unlock Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Fundamentals** | Focus | 100 | Multiplies all **Skill XP** gain by `1 + 0.01 * Level`. <br/> *Improve your learning speed through intense concentration.* | Unlocked by default. |
| | Time Management | 100 | Multiplies all **Job XP** gain by `1 + 0.01 * Level`. <br/> *Learn to procrastinate less and receive more job experience per day.* | Focus Level 5. |
| | Frugality | 100 | Multiplies all **Expenses** by `1 - log₇(Level + 1) / 10` (min 0.1). <br/> *Study the tricks of budgeting to lower any type of expense.* | Focus Level 20. |
| | Meditation | 100 | Multiplies **Inspiration** by `1 + 0.01 * Level`. <br/> *Fill your mind with peace to tap into greater inspiration from within.* | Focus Level 30, Time Management Level 20. |
| **Writing Craft**| Typing Speed | 100 | Multiplies your base **Writing Speed** by `1 + 0.01 * Level`. <br/> *Practice your typing to get words on the page faster.* | Unlocked by default. |
| | Grammar & Prose | 100 | Increases **Book Quality**. Multiplies **Creative Industry Job XP** gain by `1 + 0.01 * Level`. <br/> *Study the rules of language to write more beautifully.* | Focus Level 20. |
| | Plotting | 100 | Increases **Book Quality** and **Book Length**. Multiplies **Literary Elite Job XP** by `1 + 0.01 * Level`. <br/> *Strengthen your storytelling ability to craft compelling narratives.* | Focus Level 200, Meditation Level 200. |
| | Character Dev. | 100 | Increases **Book Quality**. Multiplies **Typing Speed skill XP** gain by `1 + 0.01 * Level`. <br/> *Learn to create lifelike characters through habit and observation.* | Focus Level 30, Typing Speed Level 30. |
| **Lifestyle** | Healthy Lifestyle | 100 | Multiplies **Lifespan** by `1 + log₃₃(Level + 1)`. <br/> *Lengthen your lifespan through diet and exercise. More time to write!* | Junior Agent Level 10. |
| | Flow State | 100 | Multiplies **Game Speed** by `1 + log₁₃(Level + 1)`. <br/> *Bend your perception of time through deep, uninterrupted work.* | Senior Agent Level 10. |
| | Longevity Secrets| 100 | Multiplies **Lifespan** by `1 + 0.01 * Level`. <br/> *Through harnessing modern science, lengthen your lifespan drastically.* | Head of Publishing Level 1000. |
| **The Business of Writing**| Brand Management | 100 | Multiplies **All XP** gain by `1 + 0.01 * Level`. <br/> *Encompass yourself with the power of your author brand, allowing you to absorb any job or skill with ease.* | 1 Fame. |
| | Networking | 100 | Multiplies **Fame Gain** on retirement by `1 + 0.01 * Level`. <br/> *Cultivate your industry connections, improving Fame gain between lifetimes.* | 1 Fame. |
| | Public Speaking | 100 | Multiplies all **Expenses** by `1 - log₇(Level + 1) / 10` (min 0.1). <br/> *Learn to command a room, striking better deals and earning heavy discounts.* | 1 Fame. |
| | Personal Brand | 100 | Multiplies **All XP** gain by `1 + 0.01 * Level`. <br/> *A human mind is too feeble to grasp the market. Develop a powerful brand to absorb knowledge rapidly.* | 25 Fame. |
| | Media Tours | 100 | Multiplies **Fame Gain** on retirement by `1 + 0.01 * Level`. <br/> *Grow your fame through TV appearances and interviews, drastically increasing Fame gain.* | 75 Fame. |
| | Royalty Negotiation| 100 | Multiplies **Job Income** by `1 + 0.002 * Level`. <br/> *Through shrewd negotiation, multiply the value of contracts and advances you receive from your job.* | 500 Fame. |

---

### 6. The Shop (Housing & Equipment)

#### **Housing**

| Housing Tier | Expense/day | Inspiration Effect | Description & Unlock Requirements |
| :--- | :--- | :--- | :--- |
| Homeless | $0 | x1.0 | *Sleep on the streets or in shelters. It cannot get any worse than this.* <br/> **Req:** Unlocked by default. |
| Rented Room | $15 | x1.4 | *A small room in a shared house. Horrible conditions but at least you have a roof over your head.* <br/> **Req:** Unlocked by default. |
| Studio Apartment | $100 | x2.0 | *A single, small room that serves as your kitchen, bedroom, and office. The radiator is noisy.* <br/> **Req:** Earned $10,000 total. |
| Suburban House | $750 | x3.5 | *A small house in the suburbs. Provides decent living conditions for a fair price.* <br/> **Req:** Earned $75,000 total. |
| Large House | $3,000 | x6.0 | *A building with a few rooms and a yard. Although quite expensive, it is a comfortable abode.* <br/> **Req:** Earned $300,000 total. |
| City Penthouse | $25,000 | x12.0 | *Much larger than a regular house, boasting amazing city views. The building is quite spacious but comes with a hefty price tag.* <br/> **Req:** Earned $2,500,000 total. |
| Private Villa | $300,000 | x25.0 | *A very rich and meticulously built structure with a pool and guest house. Extremely high expenses for a lavish lifestyle.* <br/> **Req:** Earned $30,000,000 total. |
| Mansion Estate | $5,000,000| x60.0 | *A grand residence with its own grounds and staff. Provides the utmost luxurious and comfortable living conditions for a ludicrous price.* <br/> **Req:** Earned $500,000,000 total. |

#### **Equipment**

| Item Name | Expense/day | Effect | Description & Unlock Requirements |
| :--- | :--- | :--- | :--- |
| Library Card | $10 | x1.5 Skill XP | *Access to a world of information, allowing you to learn a lot more quickly.* <br/> **Req:** Unlocked by default. |
| Used Laptop | $50 | x1.5 Typing Speed XP | *A cheap computer used for writing exercises to improve your typing even faster than before.* <br/> **Req:** Earned $5,000 total. |
| Editor | $200 | x2.0 Job XP | *A freelance editor who assists with your work, giving you more time to be productive.* <br/> **Req:** Earned $20,000 total. |
| Style Guide | $1,000 | x2.0 Creative Ind. XP | *A reference book for grammar and style, helping you gain experience in your creative work faster.* <br/> **Req:** Earned $100,000 total. |
| Ergonomic Chair | $7,500 | x1.5 Inspiration | *A comfortable, supportive chair that keeps your body and mind fresh, leaving you in a happier, stress-free mood.* <br/> **Req:** Earned $750,000 total. |
| Pro Writing Software| $50,000 | x3.0 Writing Craft XP | *Powerful software with outlining and editing tools, providing a much easier time learning the craft.* <br/> **Req:** Earned $5,000,000 total. |
| Home Office | $1,000,000 | x2.0 Skill XP | *A dedicated area which provides fine stationary and equipment designed for furthering your progress.* <br/> **Req:** Earned $100,000,000 total. |
| Home Library | $10,000,000| x1.5 Skill XP | *A personal collection of books, each containing vast amounts of information from life skills to literary theory.* <br/> **Req:** Earned $1,000,000,000 total. |

---

### 7. Retirement & Prestige (The "Golden Pen" Tab)

The prestige mechanic, unlocked via the Golden Pen tab at age 25.

#### **First-Tier Prestige ("Start a New Chapter")**
*   **Unlock Condition:** Becomes available at age 65. Forced at 70 (or end of lifespan).
*   **On Retirement:**
    *   Your age resets to 18.
    *   Money, Job, Skill, Housing, and Equipment are reset to their defaults.
    *   All Job and Skill levels and XP are reset to 0.
    *   **Legacy Bonus:** The highest level achieved for each task is saved. In all future lives, you gain a permanent XP multiplier for that task: **`1 + (Max Level / 20)`**.

#### **Second-Tier Prestige ("Become a Legend")**
*   **Unlock Condition:** Becomes available after living a cumulative total of **200 years** across all lives.
*   **On Retirement:**
    *   All resets from the First-Tier Prestige occur.
    *   **Crucially, all `maxLevel` progress for the Legacy Bonus is reset to 0.**
    *   You gain **Fame** based on your total lifetime readers and Fame-boosting skills.
    *   The **The Business of Writing** skill category is permanently unlocked, powered by your permanent pool of Fame.




--------------------










---

### Primary Recommendation: "Cozy Lo-Fi Illustration" (Stylized Vector/Digital Art)

**Think:** The "Lo-Fi Hip Hop Radio" background, games like *Coffee Talk*, or the app *Forest*.
**Vibe:** Warm, slightly nostalgic, highly readable, and deeply associated with studying, writing, and focus.

This style uses clean line-art, flat colors with subtle cell-shading, and heavy use of lighting to convey mood. It perfectly captures the romanticized idea of being a writer.

#### How to apply this style:

**1. The Color Palette (Progressive)**
In incremental games, visual progression is key. The colors of your art should evolve as the player levels up:
*   **Early Game (Menial/Homeless):** Muted, cool tones. Grays, washed-out blues, harsh fluorescent greens (representing the Gig Worker/Food Service grind).
*   **Mid Game (Creative/Rented Room):** Warm, cozy tones. Sepia, coffee-brown, amber, soft sunlight, and desk-lamp yellows.
*   **Late Game (Literary Elite/Mansion):** Luxurious, bold tones. Deep mahogany, royal purple, crisp whites, and metallic gold accents (especially for the "Fame" and "Golden Pen" tabs).

**2. Jobs (Character & Environment Vignettes)**
Job icons should be small, square/circular vignettes showing hands or a torso interacting with the environment.
*   *Gig Worker:* A hand holding a cracked smartphone in the rain.
*   *Copy Editor:* A steaming mug of coffee next to a manuscript covered in red ink corrections.
*   *Ghostwriter:* Hands typing on a sleek mechanical keyboard, with a blurred silhouette of a famous person in the background.
*   *Head of Publishing:* A wide, clean isometric view of a massive mahogany desk overlooking a city skyline.

**3. Skills (Abstract & Metaphorical)**
Since skills are abstract concepts, use clean, symbolic icons with a cohesive theme (like ink, paper, or the brain).
*   *Time Management:* An hourglass where the sand falling forms into letters on a page.
*   *Flow State:* A glowing, ethereal brain or a pen floating above a page surrounded by a soft, glowing aura.
*   *Meditation:* A character silhouetted in a lotus pose, with a thought bubble containing an open book.
*   *Brand Management:* A wax seal stamping a golden logo onto a crisp white envelope.

**4. Housing & Equipment (Isometric or Still Life)**
*   **Housing** looks best when presented as **Isometric cross-sections** (like a dollhouse view).
    *   *Studio Apartment:* Cluttered, warm desk lamp, tiny bed next to a radiator.
    *   *City Penthouse:* Sleek, modern, glass windows, minimalist furniture.
*   **Equipment** should be "Still Life" objects drawn with thick, satisfying outlines.
    *   *Library Card:* A worn, bent card sticking out of an old leather wallet.
    *   *Pro Writing Software:* A glowing, modern laptop screen showing a dark-mode writing interface with a sleek UI.

---

### Alternative Art Styles

If the "Cozy Lo-Fi" aesthetic doesn't fit your vision, here are two other strong directions that fit the GDD:

#### Alternative 1: High-Bit Modern Pixel Art
*   **Vibe:** Retro, indie, "grindy," and charming. (Think *Stardew Valley* or *Game Dev Tycoon*).
*   **Why it works:** Incremental games and pixel art are a match made in heaven. It is very easy to create hundreds of 32x32 or 64x64 icons for your various skills and items. Pixel art is excellent for conveying the "homeless to millionaire" progression in a lighthearted way. It keeps the UI snappy and lightweight.

#### Alternative 2: Vintage Print / Art Deco
*   **Vibe:** Classic literature, Great Gatsby, old printing presses, academia.
*   **Why it works:** It leans heavily into the "Golden Pen" prestige mechanic. The UI looks like an old leather-bound book, with parchment-textured backgrounds.
*   **Execution:** Icons are monochromatic (sepia or dark brown ink) resembling woodblock prints or old newspaper illustrations. When a player "Prestiges" and earns **Fame**, the UI could introduce genuine Gold Foil/Art Deco line-work to signify their transition from a nobody to a timeless literary legend.

### Summary for your UI Layout
Regardless of the style you choose, because this is a text-and-number heavy incremental game, ensure that:
*   The **"Writing Process" panel** (which is always visible) has the most dynamic art—perhaps an animation of a book filling up with ink, or a typewriter where the keys clack automatically based on your *Writing Speed*.
*   The **Golden Pen Tab** should visually contrast with the rest of the game. If the base game is normal/modern, the Prestige tab should look mystical, glowing, or ancient to make the player feel they are building a permanent legacy.
