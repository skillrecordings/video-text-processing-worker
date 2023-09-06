# Video Text Processing Worker

This is a Cloudflare Worker project used to order transcripts from Deepgram.

## Environment

There is a template for the `dev.vars` environment variables at `.dev.vars.
template` that has the appropriate variables to add for local development. 
Note that it likely won't work very well locally.

## Deploying

```bash
npm run deploy
```