## Progress Knight Game Documentation

This document outlines all the jobs, skills, items, and core game mechanics based on the provided code.

---

### **Table of Contents**
1.  [Core Game Mechanics & Formulas](#1-core-game-mechanics--formulas)
2.  [Multiplier Logic](#2-multiplier-logic)
3.  [Jobs](#3-jobs)
4.  [Skills](#4-skills)
5.  [Shop Items](#5-shop-items)
6.  [Rebirth (Amulet) System](#6-rebirth-amulet-system)

---

### **1. Core Game Mechanics & Formulas**

#### **Time & Age**
*   The game runs at a base speed of **4 game days per second** (when not paused and alive).
*   **Lifespan:** Your base lifespan is 70 years (25,550 days). This can be extended by the *Immortality* and *Super Immortality* skills.
*   **Death:** If your age exceeds your lifespan, the game pauses, and you must use the Amulet to rebirth.

#### **Tasks (Jobs & Skills)**
All Jobs and Skills are "Tasks" and share these core formulas:

*   **Max XP for next level:** `round(BaseMaxXP * (CurrentLevel + 1) * 1.01 ^ CurrentLevel)`
*   **XP Gain:** The base XP gain is 10/sec, which is then modified by all applicable multipliers.
*   **Max Level Bonus:** After your first rebirth, you gain an XP multiplier for each task based on the highest level you achieved in a previous life.
    *   **Formula:** `1 + (MaxLevel / 10)`

#### **Currency (Coins)**
*   The game uses a tiered currency system: copper (c), silver (s), gold (g), and platinum (p).
*   `100c = 1s`, `100s = 1g`, `100p = 1g`.
*   **Income:** Gained from your `currentJob`.
*   **Expenses:** Sum of the daily costs of your `currentProperty` and all active `currentMisc` items.
*   **Bankruptcy:** If your coin balance drops below zero, you become Homeless, and all your Misc items are removed.

#### **Happiness**
Happiness is a direct multiplier to **all XP gain**.
*   **Formula:** `(Meditation Effect) * (Butler Effect) * (Current Property Effect)`

#### **Evil**
Evil is a resource gained from the second type of rebirth. It primarily acts as a multiplier for Dark Magic skills.
*   **Formula for Evil Gain per Rebirth:** `(Evil Control Effect) * (Blood Meditation Effect)`

---

### **2. Multiplier Logic**

This is a summary of how different stats and items multiply each other.

#### **Universal XP Multipliers (All Jobs & Skills)**
*   **Happiness:** (see above)
*   **Max Level Bonus:** `1 + (MaxLevel / 10)`
*   **Dark Influence** (Skill)
*   **Demon Training** (Skill)

#### **Job-Specific Multipliers**
*   **Job Income:**
    *   Job Level: `1 + log10(CurrentLevel + 1)`
    *   Demon's Wealth (Skill)
    *   Strength (Skill - *Military only*)
*   **Job XP:**
    *   Productivity (Skill)
    *   Personal Squire (Item)
    *   Battle Tactics (Skill - *Military only*)
    *   Steel Longsword (Item - *Military only*)
    *   Mana Control (Skill - *The Arcane Association only*)

#### **Skill-Specific Multipliers**
*   **Skill XP:**
    *   Concentration (Skill)
    *   Book (Item)
    *   Study Desk (Item)
    *   Library (Item)
    *   Muscle Memory (Skill - *Strength skill only*)
    *   Dumbbells (Item - *Strength skill only*)
    *   Sapphire Charm (Item - *Magic skills only*)
    *   Evil (Stat - *Dark Magic skills only*)

#### **Expense Multipliers (All Items)**
*   **Bargaining** (Skill)
*   **Intimidation** (Skill)

---

### **3. Jobs**

Jobs provide your main source of income.

| Category | Job Name | Base Max XP | Base Income | Description & Unlock Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Common work**| Beggar | 50 | 5 | *Struggle day and night for a couple of copper coins. It feels like you are at the brink of death each day.* <br/> **Req:** Unlocked by default. |
| | Farmer | 100 | 9 | *Plow the fields and grow the crops. It's not much but it's honest work.* <br/> **Req:** Beggar Level 10. |
| | Fisherman | 200 | 15 | *Reel in various fish and sell them for a handful of coins. A relaxing but still a poor paying job.* <br/> **Req:** Farmer Level 10. |
| | Miner | 400 | 40 | *Delve into dangerous caverns and mine valuable ores. The pay is quite meager compared to the risk involved.* <br/> **Req:** Fisherman Level 10, Strength Level 10. |
| | Blacksmith | 800 | 80 | *Smelt ores and carefully forge weapons for the military. A respectable and OK paying commoner job.* <br/> **Req:** Miner Level 10, Strength Level 30. |
| | Merchant | 1,600 | 150 | *Travel from town to town, bartering fine goods. The job pays decently well and is a lot less manually-intensive.* <br/> **Req:** Blacksmith Level 10, Bargaining Level 50. |
| **Military** | Squire | 100 | 5 | *Carry around your knight's shield and sword along the battlefield. Very meager pay but the work experience is quite valuable.* <br/> **Req:** Strength Level 5. |
| | Footman | 1,000 | 50 | *Put down your life to battle with enemy soldiers. A courageous, respectable job but you are still worthless in the grand scheme of things.* <br/> **Req:** Squire Level 10, Strength Level 20. |
| | Veteran footman | 10,000 | 120 | *More experienced and useful than the average footman, take out the enemy forces in battle with your might. The pay is not that bad.* <br/> **Req:** Footman Level 10, Battle Tactics Level 40. |
| | Knight | 100,000 | 300 | *Slash and pierce through enemy soldiers with ease, while covered in steel from head to toe. A decently paying and very respectable job.* <br/> **Req:** Veteran footman Level 10, Strength Level 100. |
| | Veteran knight | 1,000,000 | 1,000 | *Utilising your unmatched combat ability, slaugher enemies effortlessly. Most footmen in the military would never be able to acquire such a well paying job like this.* <br/> **Req:** Knight Level 10, Battle Tactics Level 150. |
| | Elite knight | 7,500,000 | 3,000 | *Obliterate squadrons of enemy soldiers in one go with extraordinary proficiency, while equipped with the finest gear. Such a feared unit on the battlefield is paid extremely well.* <br/> **Req:** Veteran knight Level 10, Strength Level 300. |
| | Holy knight | 40,000,000 | 15,000 | *Collapse entire armies in mere seconds with your magically imbued blade. The handful of elite knights who attain this level of power are showered with coins.* <br/> **Req:** Elite knight Level 10, Mana Control Level 500. |
| | Legendary knight | 150,000,000 | 50,000 | *Feared worldwide, obliterate entire nations in a blink of an eye. Roughly every century, only one holy knight is worthy of receiving such an esteemed title.* <br/> **Req:** Holy knight Level 10, Mana Control Level 1000, Battle Tactics Level 1000. |
| **The Arcane Association** | Student | 100,000 | 100 | *Study the theory of mana and practice basic spells. There is minor pay to cover living costs, however, this is a necessary stage in becoming a mage.* <br/> **Req:** Concentration Level 200, Meditation Level 200. |
| | Apprentice mage | 1,000,000 | 1,000 | *Under the supervision of a mage, perform basic spells against enemies in battle. Generous pay will be provided to cover living costs.* <br/> **Req:** Student Level 10, Mana Control Level 400. |
| | Mage | 10,000,000 | 7,500 | *Turn the tides of battle through casting intermediate spells and mentor other apprentices. The pay for this particular job is extremely high.* <br/> **Req:** Apprentice mage Level 10, Mana Control Level 700. |
| | Wizard | 100,000,000 | 50,000 | *Utilise advanced spells to ravage and destroy entire legions of enemy soldiers. Only a small percentage of mages deserve to attain this role and are rewarded with an insanely high pay.* <br/> **Req:** Mage Level 10, Mana Control Level 1000. |
| | Master wizard | 10,000,000,000| 250,000 | *Blessed with unparalleled talent, perform unbelievable feats with magic at will. It is said that a master wizard has enough destructive power to wipe an empire off the map.* <br/> **Req:** Wizard Level 10, Mana Control Level 1500. |
| | Chairman | 1,000,000,000,000 | 1,000,000 | *Spend your days administrating The Arcane Association and investigate the concepts of true immortality. The chairman receives ludicrous amounts of pay daily.* <br/> **Req:** Master wizard Level 10, Mana Control Level 2000. |

---

### **4. Skills**

Skills provide passive bonuses that affect income, XP gain, expenses, and core stats.

| Category | Skill Name | Base Max XP | Effect Logic & Description | Unlock Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Fundamentals** | Concentration | 100 | Multiplies all **Skill XP** gain by `1 + 0.01 * Level`. <br/> *Improve your learning speed through practising intense concentration activities.* | Unlocked by default. |
| | Productivity | 100 | Multiplies all **Job XP** gain by `1 + 0.01 * Level`. <br/> *Learn to procrastinate less at work and receive more job experience per day.* | Concentration Level 5. |
| | Bargaining | 100 | Multiplies all **Expenses** by `1 - log₇(Level + 1) / 10` (min 0.1). <br/> *Study the tricks of the trade and persuasive skills to lower any type of expense.* | Concentration Level 20. |
| | Meditation | 100 | Multiplies **Happiness** by `1 + 0.01 * Level`. <br/> *Fill your mind with peace and tranquility to tap into greater happiness from within.* | Concentration Level 30, Productivity Level 20. |
| **Combat** | Strength | 100 | Multiplies all **Military Job Income** by `1 + 0.01 * Level`. <br/> *Condition your body and strength through harsh training. Stronger individuals are paid more in the military.* | Unlocked by default. |
| | Battle tactics | 100 | Multiplies all **Military Job XP** gain by `1 + 0.01 * Level`. <br/> *Create and revise battle strategies, improving experience gained in the military.* | Concentration Level 20. |
| | Muscle memory | 100 | Multiplies **Strength skill XP** gain by `1 + 0.01 * Level`. <br/> *Strengthen your neurons through habit and repetition, improving strength gains throughout the body.* | Concentration Level 30, Strength Level 30. |
| **Magic** | Mana control | 100 | Multiplies **T.A.A. Job XP** gain by `1 + 0.01 * Level`. <br/> *Strengthen your mana channels throughout your body, aiding you in becoming a more powerful magical user.* | Concentration Level 200, Meditation Level 200. |
| | Immortality | 100 | Multiplies **Lifespan** by `1 + log₃₃(Level + 1)`. <br/> *Lengthen your lifespan through the means of magic. However, is this truly the immortality you have tried seeking for...?* | Apprentice Mage Level 10. |
| | Time warping | 100 | Multiplies **Game Speed** by `1 + log₁₃(Level + 1)`. <br/> *Bend space and time through forbidden techniques, resulting in a faster gamespeed.* | Mage Level 10. |
| | Super immortality | 100 | Multiplies **Lifespan** by `1 + 0.01 * Level`. <br/> *Through harnessing ancient, forbidden techniques, lengthen your lifespan drastically beyond comprehension.* | Chairman Level 1000. |
| **Dark magic** | Dark influence | 100 | Multiplies **All XP** gain by `1 + 0.01 * Level`. <br/> *Encompass yourself with formidable power bestowed upon you by evil, allowing you to pick up and absorb any job or skill with ease.* | 1 Evil. |
| | Evil control | 100 | Multiplies **Evil Gain** on rebirth by `1 + 0.01 * Level`. <br/> *Tame the raging and growing evil within you, improving evil gain in-between rebirths.* | 1 Evil. |
| | Intimidation | 100 | Multiplies all **Expenses** by `1 - log₇(Level + 1) / 10` (min 0.1). <br/> *Learn to emit a devilish aura which strikes extreme fear into other merchants, forcing them to give you heavy discounts.* | 1 Evil. |
| | Demon training | 100 | Multiplies **All XP** gain by `1 + 0.01 * Level`. <br/> *A mere human body is too feeble and weak to withstand evil. Train with forbidden methods to slowly manifest into a demon, capable of absorbing knowledge rapidly.* | 25 Evil. |
| | Blood meditation | 100 | Multiplies **Evil Gain** on rebirth by `1 + 0.01 * Level`. <br/> *Grow and culture the evil within you through the sacrifise of other living beings, drastically increasing evil gain.* | 75 Evil. |
| | Demon's wealth | 100 | Multiplies **Job Income** by `1 + 0.002 * Level`. <br/> *Through the means of dark magic, multiply the raw matter of the coins you receive from your job.* | 500 Evil. |

---

### **5. Shop Items**

Items must be purchased to be used. Properties provide a Happiness bonus but only one can be active. Misc items provide various bonuses and multiple can be active at once.

#### **Properties**

| Item Name | Base Expense/day | Happiness Effect | Description & Unlock Requirements |
| :--- | :--- | :--- | :--- |
| Homeless | 0 | x1.0 | *Sleep on the uncomfortable, filthy streets while almost freezing to death every night. It cannot get any worse than this.* <br/> **Req:** Unlocked by default. |
| Tent | 15 | x1.4 | *A thin sheet of tattered cloth held up by a couple of feeble, wooden sticks. Horrible living conditions but at least you have a roof over your head.* <br/> **Req:** Unlocked by default. |
| Wooden hut | 100 | x2.0 | *Shabby logs and dirty hay glued together with horse manure. Much more sturdy than a tent, however, the stench isn't very pleasant.* <br/> **Req:** 10,000 coins. |
| Cottage | 750 | x3.5 | *Structured with a timber frame and a thatched roof. Provides decent living conditions for a fair price.* <br/> **Req:** 75,000 coins. |
| House | 3,000 | x6.0 | *A building formed from stone bricks and sturdy timber, which contains a few rooms. Although quite expensive, it is a comfortable abode.* <br/> **Req:** 300,000 coins. |
| Large house | 25,000 | x12.0 | *Much larger than a regular house, which boasts even more rooms and multiple floors. The building is quite spacious but comes with a hefty price tag.* <br/> **Req:** 2,500,000 coins. |
| Small palace | 300,000 | x25.0 | *A very rich and meticulously built structure rimmed with fine metals such as silver. Extremely high expenses to maintain for a lavish lifestyle.* <br/> **Req:** 30,000,000 coins. |
| Grand palace | 5,000,000| x60.0 | *A grand residence completely composed of gold and silver. Provides the utmost luxurious and comfortable living conditions possible for a ludicrous price.* <br/> **Req:** 500,000,000 coins. |

#### **Misc**

| Item Name | Base Expense/day | Effect | Description & Unlock Requirements |
| :--- | :--- | :--- | :--- |
| Book | 10 | x1.5 Skill XP | *A place to write down all your thoughts and discoveries, allowing you to learn a lot more quickly.* <br/> **Req:** Unlocked by default. |
| Dumbbells | 50 | x1.5 Strength XP | *Heavy tools used in strenuous exercise to toughen up and accumulate strength even faster than before.* <br/> **Req:** 5,000 coins. |
| Personal squire | 200 | x2.0 Job XP | *Assists you in completing day to day activities, giving you more time to be productive at work.* <br/> **Req:** 20,000 coins. |
| Steel longsword | 1,000 | x2.0 Military XP | *A fine blade used to slay enemies even quicker in combat and therefore gain more experience.* <br/> **Req:** 100,000 coins. |
| Butler | 7,500 | x1.5 Happiness | *Keeps your household clean at all times and also prepares three delicious meals per day, leaving you in a happier, stress-free mood.* <br/> **Req:** 750,000 coins. |
| Sapphire charm | 50,000 | x3.0 Magic XP | *Embedded with a rare sapphire, this charm activates more mana channels within your body, providing a much easier time learning magic.* <br/> **Req:** 5,000,000 coins. |
| Study desk | 1,000,000 | x2.0 Skill XP | *A dedicated area which provides many fine stationary and equipment designed for furthering your progress in research.* <br/> **Req:** 100,000,000 coins. |
| Library | 10,000,000 | x1.5 Skill XP | *Stores a collection of books, each containing vast amounts of information from basic life skills to complex magic spells.* <br/> **Req:** 1,000,000,000 coins. |

---

### **6. Rebirth (Amulet) System**

The Rebirth system is the game's prestige mechanic, unlocked via the Amulet tab.

#### **First Rebirth ("Touch the eye")**
*   **Unlock Condition:** Becomes available at age 65.
*   **On Rebirth:**
    *   Your age resets to 14.
    *   Coins reset to 0.
    *   Current Job, Skill, Property, and Misc items are reset to their defaults.
    *   All Job and Skill levels and XP are reset to 0.
    *   **The highest level you achieved for each task is saved as its `maxLevel`**. This provides a permanent XP boost for that task in all future lives.
    *   Permanent unlocks like "Shop" and "Automation" remain unlocked.

#### **Second Rebirth ("Embrace evil")**
*   **Unlock Condition:** Becomes available at age 200.
*   **On Rebirth:**
    *   All of the above resets from the First Rebirth occur.
    *   **All `maxLevel` progress is reset to 0.**
    *   You gain **Evil** based on your Evil-boosting skills.
    *   The **Dark Magic** skill category is permanently unlocked.
