// api/admin/stats.js
// 📊 Database Statistics API
import { supabaseAnon as supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get questions statistics
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions_pool')
      .select('id, is_active');

    if (questionsError) {
      throw questionsError;
    }

    const totalQuestions = questionsData?.length || 0;
    const activeQuestions = questionsData?.filter(q => q.is_active)?.length || 0;

    // Get user profiles count (if table exists)
    let totalUsers = 0;
    try {
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      totalUsers = usersCount || 0;
    } catch (error) {
      // Table might not exist yet
      console.log('User profiles table not found, skipping');
    }

    // Get daily scores statistics
    let totalScores = 0;
    let avgScoreToday = 0;
    let topScoreToday = 0;
    
    try {
      const { data: scoresData, error: scoresError } = await supabase
        .from('daily_scores')
        .select('score')
        .eq('date', today);

      if (!scoresError && scoresData) {
        totalScores = scoresData.length;
        if (totalScores > 0) {
          const scores = scoresData.map(s => s.score);
          avgScoreToday = scores.reduce((a, b) => a + b, 0) / totalScores;
          topScoreToday = Math.max(...scores);
        }
      }
    } catch (error) {
      // Table might not exist yet
      console.log('Daily scores table not found, skipping');
    }

    // Get all-time total scores count
    let totalScoresAllTime = 0;
    try {
      const { count } = await supabase
        .from('daily_scores')
        .select('*', { count: 'exact', head: true });
      totalScoresAllTime = count || 0;
    } catch (error) {
      console.log('Could not get total scores count');
    }

    const stats = {
      totalQuestions,
      activeQuestions,
      totalUsers,
      totalScores: totalScoresAllTime,
      avgScoreToday: Math.round(avgScoreToday * 100) / 100,
      topScoreToday,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}