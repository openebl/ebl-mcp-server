#!/usr/bin/env node

import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getIssueEblToolDefinition, handleIssueEblTool } from './tools/issue-ebl.js';
import { getListEblsToolDefinition, handleListEblsTool } from './tools/list-ebls.js';
import { getPingToolDefinition, handlePingTool } from './tools/ping.js';

// Check if HTTP server should be enabled (default: true)
const enableHttpServer = process.env.ENABLE_HTTP_SERVER !== 'false';
const httpServerPort = parseInt(process.env.HTTP_SERVER_PORT || '3400', 10);

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
  console.info('Listing tools');
  return {
    tools: [getPingToolDefinition(), getIssueEblToolDefinition(), getListEblsToolDefinition()],
  };
});

// Implement the tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.info('Calling tool', request);
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

// const server = new McpServer({
//   name: 'Echo',
//   version: '1.0.0',
// });

// server.resource('echo', new ResourceTemplate('echo://{message}', { list: undefined }), async (uri, { message }) => ({
//   contents: [
//     {
//       uri: uri.href,
//       text: `Resource echo: ${message}`,
//     },
//   ],
// }));

// server.tool('echo', { message: z.string() }, async ({ message }) => ({
//   content: [{ type: 'text', text: `Tool echo: ${message}` }],
// }));

// server.prompt('echo', { message: z.string() }, ({ message }) => ({
//   messages: [
//     {
//       role: 'user',
//       content: {
//         type: 'text',
//         text: `Please process this message: ${message}`,
//       },
//     },
//   ],
// }));

// Start the server with appropriate transport(s)
// async function main() {
//   // const transport = new StreamableHTTPServerTransport({
//   //   sessionIdGenerator: undefined,
//   // });

//   const transports = {
//     sse: {} as Record<string, SSEServerTransport>,
//   };

//   // await server.connect(transport);

//   try {
//     // Log environment variables for debugging
//     console.error('Environment variables loaded:', {
//       BU_SERVER_URL: process.env.BU_SERVER_URL || 'not set',
//       BU_SERVER_API_KEY: process.env.BU_SERVER_API_KEY ? '****' : 'not set',
//       ENABLE_HTTP_SERVER: enableHttpServer ? 'true' : 'false',
//       HTTP_SERVER_PORT: httpServerPort,
//     });

//     // Start HTTP server with SSE support if enabled
//     if (enableHttpServer) {
//       const app = express();

//       // Configure middleware
//       app.use(express.json());

//       // Handle all MCP requests (GET, POST, DELETE) at a single endpoint
//       // app.all('/mcp', async (req, res) => {
//       //   await transport.handleRequest(req, res);
//       // });

//       // Handle legacy SSE transport
//       app.get('/sse', async (req, res) => {
//         console.info('got /sse');
//         const sseTransport = new SSEServerTransport('/messages', res);
//         console.info('got /sse', sseTransport.sessionId);
//         transports.sse[sseTransport.sessionId] = sseTransport;

//         res.on('close', () => {
//           console.info('got close', sseTransport.sessionId);
//           delete transports.sse[sseTransport.sessionId];
//         });

//         await server.connect(sseTransport);
//       });

//       app.post('/messages', async (req, res) => {
//         console.info('got /message', req.query.sessionId);
//         const sessionId = req.query.sessionId as string;
//         const sseTransport = transports.sse[sessionId];
//         console.info('got /message transport', sessionId);

//         if (sseTransport) {
//           await sseTransport.handlePostMessage(req, res);
//           console.info('complete /message', sessionId);
//         } else {
//           console.info('no transport', sessionId);
//           res.status(400).send('No transport found for sessionId');
//         }
//       });

//       // Start Express server
//       app.listen(httpServerPort, () => {
//         console.error(`HTTP Server started on port ${httpServerPort}`);
//         console.error(`- MCP endpoint: http://localhost:${httpServerPort}/mcp`);
//         console.error(`- SSE endpoint: http://localhost:${httpServerPort}/sse`);
//       });
//     }

//     // Always start stdio transport for CLI usage
//     // const stdioTransport = new StdioServerTransport();
//     // await server.connect(stdioTransport);
//     console.error('EBL MCP Server started and listening on stdio. Use Ctrl+C to stop.');
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// main();

function main() {
  // let transport: SSEServerTransport;

  const transports = {} as Record<string, SSEServerTransport>;

  console.error('Environment variables loaded:', {
    BU_SERVER_URL: process.env.BU_SERVER_URL || 'not set',
    BU_SERVER_API_KEY: process.env.BU_SERVER_API_KEY ? '****' : 'not set',
    ENABLE_HTTP_SERVER: enableHttpServer ? 'true' : 'false',
    HTTP_SERVER_PORT: httpServerPort,
  });

  const app = express();
  app.get('/sse', async (req, res) => {
    console.log('Received connection:', req.query.sessionId);
    const transport = new SSEServerTransport('/message', res);
    transports[transport.sessionId] = transport;
    await server.connect(transport);

    res.on('close', () => {
      console.info('connection closed:', transport.sessionId);
      delete transports[transport.sessionId];
    });

    // server.onclose = async () => {
    //   console.log('Server closed');
    //   // await server.close();
    //   // process.exit(0);
    // };
  });

  app.post('/message', async (req, res) => {
    console.log('Received message:', req.query.sessionId);
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
    console.info(`HTTP Server started on port ${httpServerPort}`);
    console.info(`- SSE endpoint: http://localhost:${httpServerPort}/sse`);
  });
}

main();
