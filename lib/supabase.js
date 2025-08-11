// lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to load credentials from file
function loadCredentials() {
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
    console.error('Error loading credentials:', error);
    throw new Error('Failed to load Supabase credentials from file');
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