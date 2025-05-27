import dotenv from 'dotenv';
import { NotionAPI } from './notion-api';
import { DeepseekAPI } from './deepseek-api';
import PromptSync from 'prompt-sync';

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

    const pageHeadings = nopi.getHeadingOnes();

    console.log(pageHeadings);
    const selectedHeadingNumber = parseInt(prompt("Which heading do you want to select? (1, 2, ...) "));
    const notionResult = nopi.getContentOfHeading(pageHeadings[selectedHeadingNumber - 1]);

    console.log("Got results from notion!");
    const context = `
        Generate quiz questions based on the content provided to you.
        Send the questions to me in json format where you have 
        {Question 1: {question: <the question here>, options: [option1, ..., optionN], answer: <correct answer>}, ..., Question N: { ... }}
    `
    const deepseekResult = await depi.sendToDeepseek(notionResult, context);
    console.log(deepseekResult);
}

main();