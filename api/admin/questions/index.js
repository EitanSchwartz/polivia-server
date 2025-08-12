// api/admin/questions.js
// 🗄️ Database Management API for Questions Pool
import { supabaseService as supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getQuestions(req, res);
      case 'POST':
        return await createQuestion(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 📝 GET /api/admin/questions - Get all questions with optional filters
 */
async function getQuestions(req, res) {
  const { 
    search, 
    category, 
    difficulty, 
    active, 
    limit = 100, 
    offset = 0 
  } = req.query;

  try {
    let query = supabase
      .from('questions_pool')
      .select('*');

    // Apply filters
    if (search) {
      query = query.ilike('question_text', `%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (active !== undefined) {
      query = query.eq('is_active', active === 'true');
    }

    // Apply pagination
    query = query
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format response to match Android model
    const formattedQuestions = data.map(question => ({
      id: question.id,
      questionText: question.question_text,
      answers: question.answers,
      correctAnswerIndex: question.correct_answer_index,
      category: question.category,
      difficulty: question.difficulty,
      isActive: question.is_active,
      createdAt: question.created_at
    }));

    res.status(200).json(formattedQuestions);

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
}

/**
 * ➕ POST /api/admin/questions - Create new question
 */
async function createQuestion(req, res) {
  const { 
    questionText, 
    answers, 
    correctAnswerIndex, 
    category, 
    difficulty, 
    isActive = true 
  } = req.body;

  // Validation
  if (!questionText || !answers || correctAnswerIndex === undefined || !category || !difficulty) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: questionText, answers, correctAnswerIndex, category, difficulty' 
    });
  }

  if (!Array.isArray(answers) || answers.length !== 4) {
    return res.status(400).json({ 
      success: false,
      message: 'Answers must be an array of exactly 4 strings' 
    });
  }

  if (correctAnswerIndex < 0 || correctAnswerIndex > 3) {
    return res.status(400).json({ 
      success: false,
      message: 'correctAnswerIndex must be between 0 and 3' 
    });
  }

  if (answers.some(answer => !answer || answer.trim().length === 0)) {
    return res.status(400).json({ 
      success: false,
      message: 'All answers must be non-empty strings' 
    });
  }

  try {
    const { data, error } = await supabase
      .from('questions_pool')
      .insert([{
        question_text: questionText.trim(),
        answers: answers.map(a => a.trim()),
        correct_answer_index: correctAnswerIndex,
        category: category.toLowerCase(),
        difficulty: difficulty.toLowerCase(),
        is_active: isActive
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: {
        id: data.id,
        questionText: data.question_text,
        answers: data.answers,
        correctAnswerIndex: data.correct_answer_index,
        category: data.category,
        difficulty: data.difficulty,
        isActive: data.is_active,
        createdAt: data.created_at
      }
    });

  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create question' 
    });
  }
}

