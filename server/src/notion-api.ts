import { Client, isFullPage, isFullBlock } from "@notionhq/client";
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

interface NotionRecallConfig {
  notionToken: string;
}

interface HeadingNode {
  text: string;
  level: number;
  id: string; // block ID for later content retrieval
  children: HeadingNode[];
}

interface SimplifiedHeadingNode {
  text: string;
  children?: SimplifiedHeadingNode[];
}

export class NotionAPI {
  private readonly notion: Client;
  private currentPageId: string | null = null;
  private headingHierarchy: HeadingNode[] = [];
  private blockMap: Map<string, any> = new Map(); // Stores all blocks by ID

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
        this.headingHierarchy = [];
        return false;
      }

      this.currentPageId = matchingPage.id;
      await this.buildHeadingHierarchy(matchingPage.id);
      return true;

    } catch (error) {
      console.error('Error fetching page from workspace:', error);
      this.currentPageId = null;
      this.headingHierarchy = [];
      return false;
    }
  }

  public getHeadingHierarchy(): SimplifiedHeadingNode[] {
    if (!this.currentPageId) {
      throw new Error('No page loaded. Call getPageFromWorkspace first.');
    }
    return this.simplifyHierarchy(this.headingHierarchy);
  }

  private simplifyHierarchy(nodes: HeadingNode[]): SimplifiedHeadingNode[] {
    return nodes.map(node => {
      const simplifiedNode: { text: string; children?: any[] } = { text: node.text };
      if (node.children.length > 0) {
        simplifiedNode.children = this.simplifyHierarchy(node.children);
      }
      return simplifiedNode;
    });
  }

  public async getContentForHeadings(acceptList: string[], rejectList: string[]): Promise<string> {
    if (!this.currentPageId) {
      throw new Error('No page loaded. Call getPageFromWorkspace first.');
    }
  
    // Find all heading nodes that match the accept list
    const acceptedNodes = this.findAcceptedNodes(this.headingHierarchy, acceptList);
    
    // Filter out rejected nodes
    const filteredNodes = this.filterRejectedNodes(acceptedNodes, rejectList);
    
    // Get content for remaining nodes
    let content = '';
    for (const node of filteredNodes) {
      content += await this.getHeadingContent(node);
    }
  
    return content;
  }
  
  private async buildHeadingHierarchy(pageId: string): Promise<void> {
    const blocks = await this.fetchPageContent(pageId);
    this.blockMap = new Map(blocks.map(block => [block.id, block]));
    
    const headingNodes: HeadingNode[] = [];
    const stack: { node: HeadingNode; level: number }[] = [];

    for (const block of blocks) {
      if (!isFullBlock(block)) continue;
      
      if (block.type.startsWith('heading_')) {
        const level = parseInt(block.type.split('_')[1]);
        const text = this._extractBlockText(block);
        
        if (!text) continue;
        
        const newNode: HeadingNode = {
          text,
          level,
          id: block.id,
          children: []
        };

        // Find the right parent in the stack
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          headingNodes.push(newNode);
        } else {
          stack[stack.length - 1].node.children.push(newNode);
        }

        stack.push({ node: newNode, level });
      }
    }

    this.headingHierarchy = headingNodes;
  }

  private findAcceptedNodes(
    nodes: HeadingNode[],
    acceptList: string[],
    parentAccepted: boolean = false
  ): HeadingNode[] {
    return nodes
      .map(node => {
        const isAccepted = parentAccepted || acceptList.includes(node.text);
        return {
          ...node,
          children: this.findAcceptedNodes(node.children, acceptList, isAccepted)
        };
      })
      .filter(node => {
        // Keep if:
        // 1. This node is explicitly accepted, OR
        // 2. Any of its children are accepted, OR
        // 3. Its parent was accepted
        return acceptList.includes(node.text) || 
               node.children.length > 0 ||
               parentAccepted;
      });
  }
  
  private filterRejectedNodes(
    nodes: HeadingNode[],
    rejectList: string[]
  ): HeadingNode[] {
    return nodes
      .filter(node => !rejectList.includes(node.text))
      .map(node => ({
        ...node,
        children: this.filterRejectedNodes(node.children, rejectList)
      }));
  }
  
  private async getHeadingContent(headingNode: HeadingNode): Promise<string> {
    let content = `# ${headingNode.text}\n\n`;
    
    // Get content between this heading and the next one at the same level
    let currentBlockId = headingNode.id;
    const blocks: any[] = [];
    
    while (currentBlockId) {
      const block = this.blockMap.get(currentBlockId);
      if (!block) break;
      
      // Stop if we hit another heading at same or higher level
      if (block.id !== headingNode.id && 
          block.type.startsWith('heading_')) {
        const level = parseInt(block.type.split('_')[1]);
        if (level <= headingNode.level) break;
      }
      
      blocks.push(block);
      
      // Get next block (this is simplified - may need more complex logic)
      const siblings = await this.notion.blocks.children.list({
        block_id: this.currentPageId!,
        start_cursor: currentBlockId,
        page_size: 1
      });
      
      currentBlockId = siblings.results[0]?.id;
    }
    
    // Process the collected blocks
    for (const block of blocks) {
      if (block.id === headingNode.id) continue; // skip the heading itself
      
      const text = this._extractBlockText(block);
      if (text) {
        content += text + '\n\n';
      }
    }
    
    // Process children recursively
    for (const child of headingNode.children) {
      content += await this.getHeadingContent(child);
    }
    
    return content;
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
        return block.bulleted_list_item.rich_text
          .map((t: any) => t.plain_text)
          .join("");
      case "numbered_list_item":
        return block.numbered_list_item.rich_text
          .map((t: any) => t.plain_text)
          .join("");
      case "to_do":
        return block.to_do.rich_text.map((t: any) => t.plain_text).join("");
      case "quote":
        return block.quote.rich_text.map((t: any) => t.plain_text).join("");
      case "code":
        return "```" +
          block.code.language +
          "\n" +
          block.code.rich_text.map((t: any) => t.plain_text).join("") +
          "\n```";
      case "toggle":
        return block.toggle.rich_text.map((t: any) => t.plain_text).join("");
      case "callout":
        return block.callout.rich_text.map((t: any) => t.plain_text).join("");
      default:
        return "";
    }
  }
}