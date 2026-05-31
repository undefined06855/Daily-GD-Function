# Daily GD Function

This simply displays a unique GD function every day!

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run main
```

The following environment variables should be defined (Bun will automatically load them from a `.env` file, if present.)
```env
PORT=8080                       # The port to host the site on (default: 443)
FIRST_DAY=2026-04-17T00:00Z     # What date to consider day "zero" (default: January 1st, 2000)
REFRESH_EMBED_CRON=0 23 * * *   # When to preload today's embed URL. Cron jobs always run in UTC, regardless of timezone (default: disabled)
TIMEZONE=+01:00                 # The timezone to consider midnight in (default: utc)
DEVELOPMENT=true                # Whether Bun.serve is in development mode or not (default: false)
```

To host the X dot com the everything app formerly Twitter dot com bot (for whatever reason), you can also set the
following environment variables:
```env
TWT_SEND_MESSAGE_CRON=0 23 * * * # When to tweet today's daily function (default: disabled)
TWT_CONSUMER_KEY=of three queens
TWT_CONSUMER_KEY_SECRET=who blister
TWT_OAUTH_TOKEN=and blaze
TWT_OAUTH_TOKEN_SECRET=and burn
TWT_MESSAGE_URL=https://daily-function.undefined0.dev # The URL to prepend to the current day to link to
```
This only supports OAuth 1.0 for now! (though there's not really any reason to support otherwise)

This project was created using `bun init` in bun v1.3.12. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
