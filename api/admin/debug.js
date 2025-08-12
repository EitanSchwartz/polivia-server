// api/admin/debug.js
// 🔍 Debug API to check database references
import { supabaseService as supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { questionId } = req.query;

  if (!questionId) {
    return res.status(400).json({ error: 'questionId required' });
  }

  try {
    // Check daily_scores table
    let dailyScoresCount = 0;
    try {
      const { count } = await supabase
        .from('daily_scores')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId);
      dailyScoresCount = count || 0;
    } catch (error) {
      console.log('daily_scores table check failed:', error.message);
    }

    // Check daily_questions table
    let dailyQuestionsCount = 0;
    try {
      const { count } = await supabase
        .from('daily_questions')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', questionId);
      dailyQuestionsCount = count || 0;
    } catch (error) {
      console.log('daily_questions table check failed:', error.message);
    }

    const report = {
      questionId: parseInt(questionId),
      references: {
        daily_scores: dailyScoresCount,
        daily_questions: dailyQuestionsCount,
        total: dailyScoresCount + dailyQuestionsCount
      },
      canDelete: dailyScoresCount === 0 && dailyQuestionsCount === 0
    };

    res.status(200).json(report);

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}