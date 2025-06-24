import { Client, isFullPage, isFullBlock } from "@notionhq/client";
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

interface NotionRecallConfig {
  notionToken: string;
}

interface HeadingNode {
  text: string;
  level: number;
  id: string; // block ID for later content retrieval
  simplified_id?: string; // added field for simplified ID
  children: HeadingNode[];
}

interface SimplifiedHeadingNode {
  text: string;
  id: string;
  children?: SimplifiedHeadingNode[];
}

export class NotionAPI {
  private readonly notion: Client;
  private currentPageId: string | null = null;
  private headingHierarchy: HeadingNode[] = [];
  private blockMap: Map<string, any> = new Map(); // Stores all blocks by ID
  private allBlocks: any[] = [];

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

  private simplifyHierarchy(nodes: HeadingNode[], parentId: string | null = null): SimplifiedHeadingNode[] {
    return nodes.map((node, index) => {
      const newId = parentId ? `${parentId}.${index + 1}` : `${index + 1}`;

      node.simplified_id = newId;

      const simplifiedNode: SimplifiedHeadingNode = {
        id: newId,
        text: node.text,
        children: node.children.length > 0 ? this.simplifyHierarchy(node.children, newId) : [],
      };

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
      console.log(node);
      content += await this.getHeadingContent(node);
    }

    return content;
  }

  private async buildHeadingHierarchy(pageId: string): Promise<void> {
    const blocks = await this.fetchPageContent(pageId);
    this.blockMap = new Map(blocks.map(block => [block.id, block]));
    this.allBlocks = blocks;

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
        const isAccepted = parentAccepted || acceptList.includes(node.simplified_id!);
        return {
          ...node,
          children: this.findAcceptedNodes(node.children, acceptList, isAccepted)
        };
      })
      .filter(node => {
        // Keep if:
        // 1. This node is explicitly accepted by simplified_id, OR
        // 2. Any of its children are accepted, OR
        // 3. Its parent was accepted
        return acceptList.includes(node.simplified_id!) ||
          node.children.length > 0 ||
          parentAccepted;
      });
  }

  private filterRejectedNodes(
    nodes: HeadingNode[],
    rejectList: string[]
  ): HeadingNode[] {
    return nodes
      .filter(node => !rejectList.includes(node.simplified_id!)) // Filter by simplified_id
      .map(node => ({
        ...node,
        children: this.filterRejectedNodes(node.children, rejectList)
      }));
  }

  private async getHeadingContent(headingNode: HeadingNode): Promise<string> {
    // First collect all selected heading IDs (this heading + all its children)
    const selectedHeadingIds = new Set<string>();
    this.collectHeadingIds(headingNode, selectedHeadingIds);

    let content = `${'#'.repeat(headingNode.level)} ${headingNode.text}\n\n`;
    const headingIndex = this.allBlocks.findIndex(b => b.id === headingNode.id);

    if (headingIndex === -1) return content;

    // Process blocks after the current heading
    for (let i = headingIndex + 1; i < this.allBlocks.length; i++) {
      const block = this.allBlocks[i];

      // Stop if we hit any heading not in our selected set
      if (block.type.startsWith('heading_')) {
        if (!selectedHeadingIds.has(block.id)) break;
        continue; // Skip other selected headings (they'll be processed recursively)
      }

      // Add content for non-heading blocks
      const blockText = await this.getBlockContent(block);
      if (blockText) content += blockText + '\n';
    }

    // Process children recursively
    for (const child of headingNode.children) {
      content += await this.getHeadingContent(child);
    }

    return content;
  }

  private collectHeadingIds(node: HeadingNode, idSet: Set<string>) {
    idSet.add(node.id);
    node.children.forEach(child => this.collectHeadingIds(child, idSet));
  }

  // Given a block, gets all the block content recursively if it's a full block
  private async getBlockContent(block: any, level: number = 0): Promise<string> {
    if (!isFullBlock(block)) return "";

    let content = this._extractBlockText(block);
    if (block.has_children) {
      const children = await this.fetchPageContent(block.id);
      for (const child of children) {
        const childContent = await this.getBlockContent(child, level + 1);
        content += `\n${'  '.repeat(level + 1)}${childContent}`;
      }
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
