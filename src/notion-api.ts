import { Client, isFullPage, isFullBlock } from "@notionhq/client";
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

interface NotionRecallConfig {
  notionToken: string;
}

interface HeadingContent {
  type: 'heading';
  level: number;
  text: string;
}

interface BlockContent {
  type: 'block';
  text: string;
}

type PageContentItem = HeadingContent | BlockContent;

export class NotionAPI {
  private readonly notion: Client;
  private currentPageId: string | null = null;
  private currentPageContent: PageContentItem[] = [];

  constructor(config: NotionRecallConfig) {
    this.notion = new Client({ auth: config.notionToken });
  }

  public async getPageFromWorkspace(pageName: string): Promise<boolean> {
    try {
        const response = await this.notion.search({
            query: pageName,
            filter: { property: 'object', value: 'page' }
        });

        const matchingPage = response.results.find((page): page is PageObjectResponse => {
            if (!isFullPage(page)) return false;
            const title = this._extractPageTitle(page);
            return title.toLowerCase().includes(pageName.toLowerCase());
        });

        if (!matchingPage) {
            this.currentPageId = null;
            this.currentPageContent = [];
            return false;
        }

        this.currentPageId = matchingPage.id;
        this.currentPageContent = await this.parsePageContent(matchingPage.id);
        return true;

    } catch (error) {
        console.error('Error fetching page from workspace:', error);
        this.currentPageId = null;
        this.currentPageContent = [];
        return false;
    }
}
  /**
   * Gets all H1 headings from the current page
   */
  public getHeadingOnes(): string[] {
    if (!this.currentPageContent) {
      throw new Error('No page content loaded. Call getPageContentInDatabaseHierarchy first.');
    }
    
    return this.currentPageContent
      .filter(item => item.type === 'heading' && item.level === 1)
      .map(item => (item as HeadingContent).text);
  }

  /**
   * Gets the content under a specific H1 heading
   * @param headingText - The exact text of the H1 heading to find
   * @returns The content under the heading as a string
   */
  public getContentOfHeading(headingText: string): string {
    if (!this.currentPageContent) {
      throw new Error('No page content loaded. Call getPageContentInDatabaseHierarchy first.');
    }

    let foundHeading = false;
    const content: string[] = [];
    
    for (const item of this.currentPageContent) {
      if (item.type === 'heading') {
        if (item.level === 1 && item.text === headingText) {
          foundHeading = true;
          continue;
        }
        // Stop if we encounter another H1
        if (item.level === 1 && foundHeading) {
          break;
        }
      }
      
      if (foundHeading && item.type === 'block') {
        content.push(item.text);
      }
    }

    if (!foundHeading) {
      throw new Error(`Heading "${headingText}" not found.`);
    }

    return content.join('\n').trim();
  }

  private async fetchPageContent(pageId: string): Promise<any[]> {
    const blocks = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        start_cursor: startCursor,
        page_size: 100,
      });

      blocks.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    return blocks;
  }

  private async parsePageContent(pageId: string): Promise<PageContentItem[]> {
    const blocks = await this.fetchPageContent(pageId);
    const content: PageContentItem[] = [];

    for (const block of blocks) {
      if (!isFullBlock(block)) continue;

      // Handle headings
      if (block.type.startsWith("heading_")) {
        const level = parseInt(block.type.split('_')[1]);
        const text = this._extractBlockText(block);
        
        if (text) {
          content.push({
            type: 'heading',
            level,
            text,
          });
        }
        continue;
      }

      // Handle other blocks
      const text = this._extractBlockText(block);
      if (text) {
        content.push({
          type: 'block',
          text
        });
      }
    }

    return content;
  }

  private formatPageContent(content: PageContentItem[]): string {
    let result = '';
    let currentHeadingLevel = 0;

    for (const item of content) {
      if (item.type === 'heading') {
        currentHeadingLevel = item.level;
        result += `\n\n${item.text}\n`;
      } else {
        result += item.text + '\n';
      }
    }

    return result.trim().replace(/\n{3,}/g, '\n\n');
  }

  private _extractPageTitle(page: any): string {
    if (page.properties.title?.title?.[0]?.plain_text) {
      return page.properties.title.title[0].plain_text;
    }
    if (page.properties.Name?.title?.[0]?.plain_text) {
      return page.properties.Name.title[0].plain_text;
    }
    return "Untitled";
  }

  private _extractBlockText(block: any): string {
    if (!isFullBlock(block)) return "";

    switch (block.type) {
      case "paragraph":
        return block.paragraph.rich_text
          .map((t: any) => t.plain_text)
          .join("");
      case "heading_1":
        return block.heading_1.rich_text
          .map((t: any) => t.plain_text)
          .join("");
      case "heading_2":
        return block.heading_2.rich_text
          .map((t: any) => t.plain_text)
          .join("");
      case "heading_3":
        return block.heading_3.rich_text
          .map((t: any) => t.plain_text)
          .join("");
      case "bulleted_list_item":
        return "- " +
          block.bulleted_list_item.rich_text
            .map((t: any) => t.plain_text)
            .join("");
      case "numbered_list_item":
        return "1. " +
          block.numbered_list_item.rich_text
            .map((t: any) => t.plain_text)
            .join("");
      case "to_do":
        return `[${block.to_do.checked ? "x" : " "}] ` +
          block.to_do.rich_text.map((t: any) => t.plain_text).join("");
      case "quote":
        return "> " +
          block.quote.rich_text.map((t: any) => t.plain_text).join("");
      case "code":
        return "```" +
          block.code.language +
          "\n" +
          block.code.rich_text.map((t: any) => t.plain_text).join("") +
          "\n```";
      default:
        return "";
    }
  }
}