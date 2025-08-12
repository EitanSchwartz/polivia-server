// api/admin/questions/[id].js
// 🎯 Individual Question Operations API
import { supabaseService as supabase } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const questionId = parseInt(id);

  if (!questionId || isNaN(questionId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Valid question ID is required' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getQuestion(req, res, questionId);
      case 'PUT':
        return await updateQuestion(req, res, questionId);
      case 'DELETE':
        return await deleteQuestion(req, res, questionId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 📖 GET /api/admin/questions/[id] - Get single question by ID
 */
async function getQuestion(req, res, id) {
  try {
    const { data, error } = await supabase
      .from('questions_pool')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    // Format response to match Android model
    const formattedQuestion = {
      id: data.id,
      questionText: data.question_text,
      answers: data.answers,
      correctAnswerIndex: data.correct_answer_index,
      category: data.category,
      difficulty: data.difficulty,
      isActive: data.is_active,
      createdAt: data.created_at
    };

    res.status(200).json(formattedQuestion);

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch question' 
    });
  }
}

/**
 * ✏️ PUT /api/admin/questions/[id] - Update existing question
 */
async function updateQuestion(req, res, id) {
  const { 
    questionText, 
    answers, 
    correctAnswerIndex, 
    category, 
    difficulty, 
    isActive 
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
      .update({
        question_text: questionText.trim(),
        answers: answers.map(a => a.trim()),
        correct_answer_index: correctAnswerIndex,
        category: category.toLowerCase(),
        difficulty: difficulty.toLowerCase(),
        is_active: isActive !== undefined ? isActive : true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
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
    console.error('Error updating question:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update question' 
    });
  }
}

/**
 * 🗑️ DELETE /api/admin/questions/[id] - Delete question by ID
 */
async function deleteQuestion(req, res, id) {
  try {
    const { data, error } = await supabase
      .from('questions_pool')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    
    // Check if it's a foreign key constraint error
    if (error.code === '23503' || error.message?.includes('violates foreign key constraint')) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete question because it is referenced by existing game data. Please delete related records first.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: `Failed to delete question: ${error.message || 'Unknown error'}` 
    });
  }
}