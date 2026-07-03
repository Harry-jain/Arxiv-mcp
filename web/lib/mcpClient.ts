import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

// Reuse a single MCP client + subprocess across requests in dev/server mode.
let clientPromise: Promise<Client> | null = null;

function getServerCommand() {
  // Assumes a Python venv or system python with requirements.txt installed.
  // Override with PYTHON_BIN env var if your python binary is named differently.
  const pythonBin = process.env.PYTHON_BIN || "python3";
  const serverPath = path.join(process.cwd(), "..", "server", "main.py");
  return { pythonBin, serverPath };
}

export async function getMcpClient(): Promise<Client> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const { pythonBin, serverPath } = getServerCommand();

    const transport = new StdioClientTransport({
      command: pythonBin,
      args: [serverPath],
    });

    const client = new Client(
      { name: "arxiv-mcp-web", version: "0.1.0" },
      { capabilities: {} }
    );

    await client.connect(transport);
    return client;
  })();

  return clientPromise;
}

export async function callTool(name: string, args: Record<string, unknown>) {
  const client = await getMcpClient();
  const result = await client.callTool({ name, arguments: args });
  // FastMCP returns tool output as a JSON-stringified text content block.
  const textBlock = (result.content as any[])?.find((c) => c.type === "text");
  if (!textBlock) return null;
  try {
    return JSON.parse(textBlock.text);
  } catch {
    return textBlock.text;
  }
}
