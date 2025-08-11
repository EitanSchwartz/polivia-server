// api/daily-leaderboard.js
import { supabaseAnon as supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0]; // Default to today

    // Get all scores for the date, sorted by score descending
    const { data: scores, error } = await supabase
      .from('daily_scores')
      .select(`
        username,
        score,
        correct_answers,
        total_questions,
        response_time_ms,
        submitted_at
      `)
      .eq('date', targetDate)
      .order('score', { ascending: false })
      .order('response_time_ms', { ascending: true }); // Tie-breaker: faster response wins

    if (error) {
      throw error;
    }

    if (!scores || scores.length === 0) {
      return res.status(200).json({
        date: targetDate,
        leaderboard: [],
        statistics: {
          total_participants: 0,
          average_score: 0,
          highest_score: 0
        }
      });
    }

    // Create leaderboard with ranks
    const leaderboard = scores.map((score, index) => ({
      rank: index + 1,
      username: score.username,
      score: score.score,
      correct_answers: score.correct_answers,
      total_questions: score.total_questions,
      accuracy_percentage: ((score.correct_answers / score.total_questions) * 100).toFixed(1),
      response_time_ms: score.response_time_ms,
      submitted_at: score.submitted_at
    }));

    // Calculate statistics
    const totalScores = scores.reduce((sum, s) => sum + s.score, 0);
    const averageScore = totalScores / scores.length;
    const highestScore = scores[0]?.score || 0;

    const response = {
      date: targetDate,
      leaderboard,
      statistics: {
        total_participants: scores.length,
        average_score: parseFloat(averageScore.toFixed(2)),
        highest_score: highestScore,
        updated_at: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching daily leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}