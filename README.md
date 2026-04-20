# Daily GD Function

This simply displays a unique GD function every day!

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

The following environment variables should be defined (Bun will automatically load them from a `.env` file, if present.)
```env
PORT=8080                       # The port to host the site on
FIRST_DAY=2026-04-17T00:00Z     # What date to consider day "zero"
DEVELOPMENT=true                # Whether Bun.serve is in development mode or not
```

This project was created using `bun init` in bun v1.3.12. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
