# Header sprite atlas

`header-sprites.png` was generated using the built-in imagegen tool. The transparent
atlas has five columns and four rows; CSS uses percentage positions so the source
resolution can change without altering cell coordinates.

Rows, left to right:

1. Author, age, job, skill, home
2. Transport, balance, income, royalties, expenses
3. Inspiration, badges, books, writing progress, work multiplier
4. Skill multiplier, quality, log, flow, potion

The first eighteen cells replace all header emoji, including both marquee copies.
The final two cells are available for future flow and potion indicators.

Generation prompt:

> Production game UI sprite atlas for Author's Journey. Exactly five columns by
> four rows of equal cells on a transparent background. Each icon centered in its
> cell, with no text, labels or borders. Hand-engraved ink illustrations, distressed
> brass and warm ivory highlights, forest-green shadows, tactile antique literary
> journal aesthetic and silhouettes readable at 24px. Row 1: author bust, hourglass,
> crossed work tools, brain, house. Row 2: vintage car, coin purse, rising bars,
> crown above a coin, descending bars. Row 3: lightbulb, trophy, books, quill on
> paper, briefcase. Row 4: book with gear, three stars, parchment scroll, pocket
> watch, potion bottle. Precise regular grid alignment for CSS background-position.
> Not emoji or glossy app icons; no additional symbols or frames.
