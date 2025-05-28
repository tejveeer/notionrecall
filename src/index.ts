import dotenv from 'dotenv';
import { NotionAPI } from './notion-api';
import { DeepseekAPI } from './deepseek-api';
import PromptSync from 'prompt-sync';
import { createTester } from './testers/tester-interface';

const prompt = PromptSync();

dotenv.config();

const nopi = new NotionAPI({ 
    notionToken: process.env.NOTION_SECRET_ID!, 
});

const depi = new DeepseekAPI({ 
    apiKey: process.env.DEEPSEEK_API_KEY! 
});

async function main() {
    const pageToFetch = prompt("What page do you want to fetch? ");
    const isPageFetched = await nopi.getPageFromWorkspace(pageToFetch);
    if (!isPageFetched) {
        console.log("No result from Notion.");
        return;
    }

    const pageHeadings = nopi.getTopLevelHeadings();

    console.log(pageHeadings);
    const selectedHeadingNumber = parseInt(prompt("Which heading do you want to select? (1, 2, ...) "));
    const notionResult = nopi.getContentOfHeading(pageHeadings![selectedHeadingNumber - 1]);

    const tester = createTester('tf', depi, notionResult);
    await tester.getQuestions(5)

    console.log(tester.getCurrentQuestion());
}

main();