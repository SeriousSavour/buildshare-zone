# Cloudflare Worker Setup for Shadow Browser

This guide will help you set up a Cloudflare Worker to handle the Shadow Browser proxy instead of using Supabase Edge Functions.

## Why Use Cloudflare Workers?

Cloudflare Workers provide better control over HTTP headers and content types, fixing issues where Supabase Edge Functions might override the `Content-Type` header.

## Setup Instructions

### 1. Create a Cloudflare Account
1. Go to https://dash.cloudflare.com
2. Sign up for a free account (if you don't have one)
3. Verify your email

### 2. Create a New Worker
1. Click on **Workers & Pages** in the left sidebar
2. Click **Create Application**
3. Click **Create Worker**
4. Give it a name like `shadow-browser-proxy`
5. Click **Deploy**

### 3. Upload Worker Code
1. After deployment, click **Edit Code**
2. Delete all existing code in the editor
3. Copy the entire contents of `cloudflare-worker.js` from this project
4. Paste it into the Cloudflare editor
5. Click **Save and Deploy**

### 4. Get Your Worker URL
1. After deploying, you'll see your worker URL
2. It will look like: `https://shadow-browser-proxy.your-subdomain.workers.dev`
3. Copy this URL

### 5. Configure Your Project
1. Open your `.env` file in the project root
2. Add this line (replace with your actual worker URL):
   ```
   VITE_PROXY_WORKER_URL=https://shadow-browser-proxy.your-subdomain.workers.dev
   ```
3. Save the file
4. Restart your development server

## Testing

1. Open the browser at `/browser`
2. Try navigating to a website
3. Check the browser console - you should see the proxy URL using your Cloudflare Worker
4. The website should load with proper content types

## Troubleshooting

### Worker not accessible
- Make sure the worker is deployed and active in your Cloudflare dashboard
- Check that the URL is correct in your `.env` file

### CORS errors
- The worker includes CORS headers, but if you see errors, check the Cloudflare Worker logs
- Go to your worker in the dashboard and click on "Logs" to see any errors

### Content not loading
- Check the Cloudflare Worker logs for any errors
- Make sure the target website allows proxy access
- Some websites block proxy access - this is expected

## Cost

Cloudflare Workers free tier includes:
- 100,000 requests per day
- 10ms CPU time per request

This should be more than enough for personal use!

## Fallback

If the Cloudflare Worker URL is not configured, the browser will automatically fall back to using the Supabase Edge Function proxy.
