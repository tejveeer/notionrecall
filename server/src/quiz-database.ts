// quiz-database.ts
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

interface QuizAttempt {
  quiz_type: string;
  questions: any; // JSONB data
  user_answers: any; // JSONB data
}

interface QuizMetadata {
  quiz_id: string;
  page_name: string;
  attempt_date: Date;
  quiz_type: string;
}

export class QuizDatabase {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: '127.0.0.1',
      port: 5432,
      user: 'myuser',
      password: 'mypassword',
      database: 'mydatabase',
    });
  }

  /**
   * Store quiz results in the database
   */
  async storeQuizResults(
    username: string,
    pageName: string,
    quizType: string,
    questions: any,
    userAnswers: any
  ): Promise<number> {
    const quizId = uuid();
    const attemptDate = new Date(); // Automatically use the current date and time

    const result = await this.pool.query(
      `INSERT INTO public.quiz_attempts
       (username, quiz_id, page_name, quiz_type, questions, user_answers, attempt_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [username, quizId, pageName, quizType, JSON.stringify(questions), JSON.stringify(userAnswers), attemptDate]
    );

    return result.rows[0].quiz_id;
  }

  /**
   * Get quiz metadata for a specific user
   */
  async getQuizMetadataByUser(username: string): Promise<QuizMetadata[]> {
    const result = await this.pool.query(
      `SELECT quiz_id, page_name, attempt_date, quiz_type
       FROM public.quiz_attempts
       WHERE username = $1
       ORDER BY attempt_date DESC`,
      [username]
    );

    return result.rows.map((row) => ({
      quiz_id: row.quiz_id,
      page_name: row.page_name,
      attempt_date: row.attempt_date,
      quiz_type: row.quiz_type,
    }));
  }

  /**
   * Get full quiz data by quiz ID
   */
  async getQuizAttemptById(quizId: string): Promise<QuizAttempt | null> {
    const result = await this.pool.query(
      `SELECT quiz_type, questions, user_answers
       FROM public.quiz_attempts
       WHERE quiz_id = $1`,
      [quizId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      quiz_type: row.quiz_type,
      questions: row.questions,
      user_answers: row.user_answers,
    };
  }

  /**
   * Close the pool and all underlying connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.close();
  }
}
