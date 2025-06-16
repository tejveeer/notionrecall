import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { NotionAPI } from './notion-api';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const nopi = new NotionAPI({
  notionToken: process.env.NOTION_SECRET_ID!,
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Fix: Remove the generic parameters from Request and just type the body
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
