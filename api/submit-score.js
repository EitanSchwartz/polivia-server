// api/submit-score.js
import { supabaseService as supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, score, correct_answers, total_questions, response_time_ms } = req.body;

    // Validation
    if (!username || score === undefined || correct_answers === undefined || !total_questions || !response_time_ms) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (score < 0 || correct_answers < 0 || correct_answers > total_questions) {
      return res.status(400).json({ error: 'Invalid score data' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if user already has a score for today
    const { data: existingScore } = await supabase
      .from('daily_scores')
      .select('score')
      .eq('username', username.trim())
      .eq('date', today)
      .single();

    if (existingScore) {
      // Only update if new score is higher
      if (score > existingScore.score) {
        const { error: updateError } = await supabase
          .from('daily_scores')
          .update({
            score,
            correct_answers,
            total_questions,
            response_time_ms,
            submitted_at: new Date().toISOString()
          })
          .eq('username', username.trim())
          .eq('date', today);

        if (updateError) {
          throw updateError;
        }

        res.status(200).json({
          success: true,
          message: 'New high score saved!',
          is_new_record: true,
          score
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Score recorded, but not your highest today',
          is_new_record: false,
          current_high_score: existingScore.score
        });
      }
    } else {
      // Insert new score
      const { error: insertError } = await supabase
        .from('daily_scores')
        .insert({
          username: username.trim(),
          date: today,
          score,
          correct_answers,
          total_questions,
          response_time_ms
        });

      if (insertError) {
        throw insertError;
      }

      res.status(200).json({
        success: true,
        message: 'Score saved successfully!',
        is_new_record: true,
        score
      });
    }

  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}