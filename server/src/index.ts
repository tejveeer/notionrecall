import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { NotionAPI } from './notion-api';
import { QuizDatabase } from './quiz-database';
import { createTester } from './testers';
import { DeepseekAPI } from './deepseek-api';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const nopi = new NotionAPI({
  notionToken: process.env.NOTION_SECRET_ID!,
});

const depi = new DeepseekAPI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const quizDb = new QuizDatabase();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.post('/fetch-page', async (req: any, res: any) => {
  const { pageName } = req.body;

  if (!pageName) {
    return res.status(400).json({ error: 'Page name is required' });
  }

  try {
    const isPageFetched = await nopi.getPageFromWorkspace(pageName);
    if (!isPageFetched) {
      return res.status(404).json({ success: false, message: 'No result from Notion.' });
    }

    const pageHeadings = nopi.getHeadingHierarchy();
    return res.json({ success: true, headings: pageHeadings });
  } catch (error) {
    console.error('Error fetching page:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/get-heading-content', async (req: any, res: any) => {
  const { acceptList, rejectList } = req.body;

  if (!acceptList || !rejectList) {
    return res.status(400).json({ error: 'Accept list and reject list are required' });
  }

  try {
    const content = await nopi.getContentForHeadings(acceptList, rejectList);
    console.log(content);
    return res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching heading content:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to fetch questions
app.post('/get-questions', async (req: any, res: any) => {
  const { quizType, numberOfQuestions, freestyle } = req.body;

  if (!quizType || !numberOfQuestions || freestyle === undefined) {
    return res.status(400).json({ error: 'testType, amount, and freestyle are required' });
  }

  try {
    const tester = createTester(quizType, depi, nopi.headingContent);
    const questions = await tester.getQuestions(numberOfQuestions);
    return res.json({ success: true, questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to store user's answers
app.post('/store-answers', async (req: any, res: any) => {
  const { username, pageName, quizType, questions, userAnswers } = req.body;

  if (!username || !pageName || !quizType || !questions || !userAnswers) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  console.log(username, pageName, quizType, questions, userAnswers);
  try {
    const quizId = await quizDb.storeQuizResults(username, pageName, quizType, questions, userAnswers);
    return res.json({ success: true, quizId });
  } catch (error) {
    console.error('Error storing quiz results:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get all quizzes metadata for a user
app.get('/get-quizzes', async (req: any, res: any) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const quizzes = await quizDb.getQuizMetadataByUser(username as string);
    return res.json({ success: true, quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get quiz details by quiz ID
app.get('/get-quiz', async (req: any, res: any) => {
  const { quizId } = req.query;

  if (!quizId) {
    return res.status(400).json({ error: 'Quiz ID is required' });
  }

  try {
    const quiz = await quizDb.getQuizAttemptById(quizId as string);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    return res.json({ success: true, quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
