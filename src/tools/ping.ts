import { z } from "zod";

// Define ping tool schema using zod
export const pingSchema = z.object({
  message: z.string().optional().describe("Optional message to echo back")
});

// Define ping tool handler
export const handlePingTool = async (args: unknown) => {
  try {
    // Parse and validate arguments using zod
    const validatedArgs = pingSchema.parse(args);
    
    // Generate response
    const timestamp = new Date().toISOString();
    const message = validatedArgs.message || "No message provided";
    
    const result = `PING RESPONSE:
Server: ebl-mcp-server
Timestamp: ${timestamp}
Message: ${message}
Status: OK`;
    
    return {
      content: [
        {
          type: "text",
          text: result
        }
      ]
    };
  } catch (error) {
    console.error("Error in ping tool:", error);
    
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error in ping tool: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
};

// Tool definition for MCP server
export const getPingToolDefinition = () => ({
  name: "ping",
  description: "Simple ping tool to test the MCP server connection",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Optional message to echo back"
      }
    },
    required: []
  }
});
