// api/daily-question.js
// 🎯 GUARANTEES: All users get the same question each day
// - First user of the day triggers random selection
// - Selected question is saved with PRIMARY KEY on date
// - Subsequent users get the already-selected question
// - Race conditions are handled gracefully
import { supabaseAnon as supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // First, try to get existing question for today
    let { data: dailyQuestion, error: dailyError } = await supabase
      .from('daily_questions')
      .select(`
        date,
        questions_pool (
          id,
          question_text,
          answers,
          correct_answer_index,
          category,
          difficulty
        )
      `)
      .eq('date', today)
      .single();

    let selectedQuestion;

    if (dailyError || !dailyQuestion) {
      // No question selected for today, pick a random one
      const { data: randomQuestion, error: randomError } = await supabase
        .from('questions_pool')
        .select('*')
        .eq('is_active', true)
        .order('random()')
        .limit(1)
        .single();

      if (randomError || !randomQuestion) {
        return res.status(404).json({ error: 'No questions available' });
      }

      // Try to save today's selection (handle race condition)
      const { error: insertError } = await supabase
        .from('daily_questions')
        .insert({
          date: today,
          question_id: randomQuestion.id
        });

      if (insertError) {
        // Insert failed - likely because another user just inserted a question
        // Fetch the question that was actually saved
        const { data: actualQuestion, error: fetchError } = await supabase
          .from('daily_questions')
          .select(`
            date,
            questions_pool (
              id,
              question_text,
              answers,
              correct_answer_index,
              category,
              difficulty
            )
          `)
          .eq('date', today)
          .single();

        if (fetchError || !actualQuestion) {
          return res.status(500).json({ error: 'Failed to get daily question' });
        }

        selectedQuestion = actualQuestion.questions_pool;
      } else {
        // Successfully inserted our random selection
        selectedQuestion = randomQuestion;
      }
    } else {
      selectedQuestion = dailyQuestion.questions_pool;
    }

    // Get participant count for today
    const { count } = await supabase
      .from('daily_scores')
      .select('*', { count: 'exact', head: true })
      .eq('date', today);

    const response = {
      id: selectedQuestion.id,
      date: today,
      question: selectedQuestion.question_text,
      answers: selectedQuestion.answers,
      correct_answer_index: selectedQuestion.correct_answer_index,
      category: selectedQuestion.category,
      difficulty: selectedQuestion.difficulty,
      participants_count: count || 0
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching daily question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}