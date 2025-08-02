// Environment Configuration for Vendor Dashboard
// Copy these values to your .env.local file

export const config = {
  // Supabase Configuration (Live Credentials from MCP)
  NEXT_PUBLIC_SUPABASE_URL: 'https://mfbnxhjfbzbxvuzzbryu.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYm54aGpmYnpieHV6emJyeXUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjMxMTE1NywiZXhwIjoyMDUxODg3MTU3fQ.E94k7v8aMXASQnI9Pe2vIubhK3zjX6TWrAqxd4a2S2U',
  
  // App Configuration
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: 'Be Smart Vendor Dashboard',
  
  // Development Settings
  NODE_ENV: 'development'
}

// Create .env.local file with these contents:
/*
NEXT_PUBLIC_SUPABASE_URL=https://mfbnxhjfbzbxvuzzbryu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYm54aGpmYnpieHV6emJyeXUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjMxMTE1NywiZXhwIjoyMDUxODg3MTU3fQ.E94k7v8aMXASQnI9Pe2vIubhK3zjX6TWrAqxd4a2S2U
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Be Smart Vendor Dashboard
NODE_ENV=development
*/