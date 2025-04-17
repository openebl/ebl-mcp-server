#!/usr/bin/env node

import 'dotenv/config'; // Load environment variables from .env file
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getIssueEblToolDefinition, handleIssueEblTool } from './tools/issue-ebl.js';
import { getListEblsToolDefinition, handleListEblsTool } from './tools/list-ebls.js';
import { getPingToolDefinition, handlePingTool } from './tools/ping.js';

// Create the server
const server = new Server(
  {
    name: 'ebl-mcp-server',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [getPingToolDefinition(), getIssueEblToolDefinition(), getListEblsToolDefinition()],
  };
});

// Implement the tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const toolArgs = request.params.arguments;

  // Route to appropriate tool handler
  switch (toolName) {
    case 'ping':
      return handlePingTool(toolArgs);
    case 'issue_ebl':
      return handleIssueEblTool(toolArgs);
    case 'list_ebls':
      return handleListEblsTool(toolArgs);
    default:
      // Handle unknown tool
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${toolName}`,
          },
        ],
      };
  }
});

// Start the server with stdio transport
async function main() {
  try {
    // Log environment variables for debugging
    console.error('Environment variables loaded:', {
      BU_SERVER_URL: process.env.BU_SERVER_URL || 'not set',
      BU_SERVER_API_KEY: process.env.BU_SERVER_API_KEY ? '****' : 'not set',
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('EBL MCP Server started and listening on stdio. Use Ctrl+C to stop.');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
