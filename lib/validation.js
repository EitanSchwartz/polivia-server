// lib/validation.js

// Validate username
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required and must be a string' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Username must be at least 2 characters long' };
  }
  
  if (trimmed.length > 20) {
    return { isValid: false, error: 'Username must be no more than 20 characters long' };
  }
  
  // Allow Hebrew, English, numbers, and basic symbols
  const validUsernameRegex = /^[\u0590-\u05FFa-zA-Z0-9_-\s]+$/;
  if (!validUsernameRegex.test(trimmed)) {
    return { isValid: false, error: 'Username contains invalid characters' };
  }
  
  return { isValid: true, value: trimmed };
}

// Validate score data
export function validateScoreData(scoreData) {
  const { score, correct_answers, total_questions, response_time_ms } = scoreData;
  
  // Check required fields
  if (score === undefined || correct_answers === undefined || !total_questions || !response_time_ms) {
    return { isValid: false, error: 'Missing required score fields' };
  }
  
  // Check data types
  if (typeof score !== 'number' || typeof correct_answers !== 'number' || 
      typeof total_questions !== 'number' || typeof response_time_ms !== 'number') {
    return { isValid: false, error: 'Score data must be numbers' };
  }
  
  // Check ranges
  if (score < 0) {
    return { isValid: false, error: 'Score cannot be negative' };
  }
  
  if (correct_answers < 0) {
    return { isValid: false, error: 'Correct answers cannot be negative' };
  }
  
  if (correct_answers > total_questions) {
    return { isValid: false, error: 'Correct answers cannot exceed total questions' };
  }
  
  if (total_questions <= 0) {
    return { isValid: false, error: 'Total questions must be positive' };
  }
  
  if (response_time_ms <= 0) {
    return { isValid: false, error: 'Response time must be positive' };
  }
  
  // Reasonable upper limits
  if (total_questions > 100) {
    return { isValid: false, error: 'Total questions cannot exceed 100' };
  }
  
  if (response_time_ms > 10 * 60 * 1000) { // 10 minutes
    return { isValid: false, error: 'Response time cannot exceed 10 minutes' };
  }
  
  return { isValid: true };
}

// Validate date format (YYYY-MM-DD)
export function validateDateFormat(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return { isValid: false, error: 'Date must be a string' };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  // Check if it's not too far in the future or past
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (date < oneYearAgo || date > oneYearFromNow) {
    return { isValid: false, error: 'Date must be within one year of current date' };
  }
  
  return { isValid: true, value: dateString };
}

// Helper to sanitize and validate request body
export function sanitizeRequestBody(body, requiredFields = []) {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object' };
  }
  
  const missing = requiredFields.filter(field => !(field in body));
  if (missing.length > 0) {
    return { isValid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  return { isValid: true };
}