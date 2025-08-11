# 🎮 Polivia Server

Backend API server for **Polivia** - Hebrew Political Trivia Game

## 🌐 Live API
- **Base URL**: `https://[your-vercel-domain].vercel.app`
- **Documentation**: Visit the base URL for endpoint documentation

## 📡 API Endpoints

### `GET /api/daily-question`
Returns today's trivia question (same for all users).

**Response:**
```json
{
  "id": 1,
  "date": "2024-01-15", 
  "question": "מי אמר: 'השלום עדיף על הצדק'?",
  "answers": ["שמעון פרס", "יצחק רבין", "אהוד ברק", "גולדה מאיר"],
  "correct_answer_index": 0,
  "category": "historical",
  "difficulty": "medium",
  "participants_count": 42
}
```

### `POST /api/submit-score`
Submits user's game score (only highest score per day is saved).

**Request:**
```json
{
  "username": "test_user",
  "score": 850,
  "correct_answers": 8,
  "total_questions": 10,
  "response_time_ms": 45000
}
```

**Response:**
```json
{
  "success": true,
  "message": "New high score saved!",
  "is_new_record": true,
  "score": 850
}
```

### `GET /api/daily-leaderboard?date=2024-01-15`
Returns daily leaderboard (sorted by score, then response time).

**Response:**
```json
{
  "date": "2024-01-15",
  "leaderboard": [
    {
      "rank": 1,
      "username": "player1",
      "score": 950,
      "correct_answers": 9,
      "total_questions": 10,
      "accuracy_percentage": "90.0",
      "response_time_ms": 30000,
      "submitted_at": "2024-01-15T10:30:00Z"
    }
  ],
  "statistics": {
    "total_participants": 42,
    "average_score": 735.5,
    "highest_score": 950,
    "updated_at": "2024-01-15T23:59:59Z"
  }
}
```

## 🔧 Features

- **🎲 Random Daily Questions**: Same question for all users each day
- **🏆 Highest Score Only**: Only saves best score per user per day  
- **📊 Real-time Leaderboards**: Live rankings updated instantly
- **🔒 Race Condition Safe**: Bulletproof concurrent access handling
- **✅ Input Validation**: Comprehensive data validation
- **🚀 Serverless**: Scales automatically on Vercel

## 🛠️ Tech Stack

- **Runtime**: Node.js 18.x (ES Modules)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel Serverless Functions
- **Architecture**: RESTful API with JSON responses

## 🗃️ Database Schema

```sql
-- Questions pool for random selection
CREATE TABLE questions_pool (
    id BIGSERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    answers JSONB NOT NULL,
    correct_answer_index INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    difficulty TEXT DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE
);

-- Daily selected questions (one per day)
CREATE TABLE daily_questions (
    date TEXT PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions_pool(id)
);

-- Daily high scores (one per user per day)  
CREATE TABLE daily_scores (
    username TEXT NOT NULL,
    date TEXT NOT NULL,
    score INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    response_time_ms BIGINT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(username, date)
);
```

## 🚀 Deployment

### Prerequisites
1. **Supabase Account**: Create database tables
2. **GitHub Repository**: Code hosted on GitHub
3. **Vercel Account**: Connected to GitHub

### Deploy Steps
1. **Import to Vercel**: Connect GitHub repository
2. **Set Environment Variables**:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key  
   SUPABASE_SERVICE_KEY=your-service-key
   ```
3. **Deploy**: Automatic deployment on push

### Local Development
```bash
npm install
npm run dev
```

## 📱 Android Integration

Update your Android app's `NetworkModule.kt`:
```kotlin
private fun getBaseUrl(): String {
    return "https://your-vercel-domain.vercel.app/"
}
```

## 🎯 Game Flow

1. **Daily Question**: App fetches today's question
2. **User Plays**: Answers trivia questions  
3. **Score Submission**: App submits final score
4. **Leaderboard**: Users view daily rankings
5. **New Day**: New question selected automatically

---

**Made with ❤️ for Hebrew trivia lovers**