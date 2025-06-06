#!/usr/bin/env node

import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getIssueEblToolDefinition, handleIssueEblTool } from './tools/issue-ebl.js';
import { getListEblsToolDefinition, handleListEblsTool } from './tools/list-ebls.js';
import { getPingToolDefinition, handlePingTool } from './tools/ping.js';

// Check if HTTP server should be enabled (default: true)
const httpServerPort = parseInt(process.env.PORT || '3400', 10);

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

function main() {
  const transports = {} as Record<string, SSEServerTransport>;

  console.error('Environment variables loaded:', {
    BU_SERVER_URL: process.env.BU_SERVER_URL || 'not set',
    BU_SERVER_API_KEY: process.env.BU_SERVER_API_KEY ? '****' : 'not set',
    PORT: httpServerPort,
  });

  // Check if we should enable stdio transport
  const enableStdio = process.argv.includes('--stdio') || process.env.ENABLE_STDIO === 'true';

  if (enableStdio) {
    console.error('Starting stdio transport');
    const stdioTransport = new StdioServerTransport();
    server.connect(stdioTransport);
  }

  const app = express();
  app.get('/sse', async (req, res) => {
    // console.error('Received connection:', req.query.sessionId);
    const transport = new SSEServerTransport('/message', res);
    transports[transport.sessionId] = transport;
    await server.connect(transport);

    res.on('close', () => {
      // console.info('connection closed:', transport.sessionId);
      delete transports[transport.sessionId];
    });
  });

  app.post('/message', async (req, res) => {
    console.error('Received message:', req.query.sessionId);
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (!transport) {
      console.error('No transport found for sessionId:', sessionId);
      res.status(400).send('No transport found for sessionId');
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  app.listen(httpServerPort, () => {
    // console.info(`HTTP Server started on port ${httpServerPort}`);
    // console.info(`- SSE endpoint: http://localhost:${httpServerPort}/sse`);
  });
}

main();
