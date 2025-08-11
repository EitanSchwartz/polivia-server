// lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to load credentials (environment variables first, then file for local dev)
function loadCredentials() {
  // First try environment variables (for Vercel/production)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_KEY) {
    return {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
    };
  }
  
  // Fallback to credentials file (for local development)
  try {
    const credentialsPath = join(__dirname, '..', '..', 'credentials', 'supabase.credentials');
    const credentialsFile = readFileSync(credentialsPath, 'utf8');
    
    const credentials = {};
    credentialsFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          credentials[key.trim()] = value.trim();
        }
      }
    });
    
    return credentials;
  } catch (error) {
    console.error('Error loading credentials from both env vars and file:', error);
    throw new Error('Failed to load Supabase credentials. Please set environment variables or credentials file.');
  }
}

// Load credentials
const credentials = loadCredentials();

// Create Supabase client with anon key for read operations
export const supabaseAnon = createClient(
  credentials.SUPABASE_URL,
  credentials.SUPABASE_ANON_KEY
);

// Create Supabase client with service key for write operations
export const supabaseService = createClient(
  credentials.SUPABASE_URL,
  credentials.SUPABASE_SERVICE_KEY
);

// Helper function to get the appropriate client
export function getSupabaseClient(needsWrite = false) {
  return needsWrite ? supabaseService : supabaseAnon;
}

// Helper function to validate credentials
export function validateSupabaseConfig() {
  const requiredKeys = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
  ];
  
  const missing = requiredKeys.filter(key => !credentials[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required credentials: ${missing.join(', ')}`);
  }
  
  return true;
}

// Export credentials for direct access if needed
export { credentials };