# Peppi Clips CDN - Cloudflare Worker

This Cloudflare Worker serves as a CDN for public Peppi clips, providing:
- Global edge caching for fast video delivery
- Free bandwidth (no egress costs from B2)
- Simple viewer page for sharing clips

## Setup

1. Install dependencies:
```bash
cd workers/clips-cdn
npm install
```

2. Configure your Cloudflare account:
```bash
npx wrangler login
```

3. Update `wrangler.toml` with your account ID

4. Set environment secrets:
```bash
npx wrangler secret put B2_ENDPOINT
# Enter: https://s3.us-west-004.backblazeb2.com (or your B2 endpoint)

npx wrangler secret put B2_CLIPS_BUCKET
# Enter: peppi-clips-your-unique-id
```

## Development

Run locally:
```bash
npm run dev
```

Test with:
```
http://localhost:8787/ABC12345
```

## Deployment

Deploy to Cloudflare:
```bash
npm run deploy
```

Your worker will be available at:
```
https://peppi-clips-cdn.your-subdomain.workers.dev
```

## Custom Domain

To use a custom domain like `clips.yourapp.com`:

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to Settings → Triggers → Custom Domains
4. Add `clips.yourapp.com`
5. Cloudflare will automatically configure DNS

## How It Works

1. User shares clip URL: `https://clips.yourapp.com/ABC12345`
2. Worker receives request at edge (closest data center to user)
3. Worker fetches video from B2 (if not cached)
4. Cloudflare caches the video at the edge
5. Subsequent requests serve from cache (instant + free bandwidth)

## URL Structure

- `/ABC12345` - Viewer page with embedded video player
- `/ABC12345/filename.mp4` - Direct video file access

## Performance

- First view: ~100-500ms (fetch from B2)
- Cached views: ~10-50ms (serve from edge)
- Global: Videos cached at 200+ data centers worldwide

