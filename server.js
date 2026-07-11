import readline from "node:readline";

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-03-26", "2024-11-05"];

const history = [];
let initialized = false;
let negotiatedProtocolVersion = "2025-11-25";

function respond(id, result) {
  process.stdout.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      result,
    }) + "\n"
  );
}

function respondError(id, code, message, data) {
  process.stdout.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        ...(data === undefined ? {} : { data }),
      },
    }) + "\n"
  );
}

function notify(method, params) {
  process.stdout.write(
    JSON.stringify({
      jsonrpc: "2.0",
      method,
      ...(params === undefined ? {} : { params }),
    }) + "\n"
  );
}

function toNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid number for "${name}"`);
  }
  return number;
}

function serialize(value) {
  return JSON.stringify(value);
}

function recordHistory(entry) {
  history.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

function toolDefinitions() {
  const baseInputSchema = {
    type: "object",
    properties: {
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["a", "b"],
    additionalProperties: false,
  };

  return [
    {
      name: "add",
      description: "Add two numbers.",
      inputSchema: baseInputSchema,
      outputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          a: { type: "number" },
          b: { type: "number" },
          result: { type: "number" },
        },
        required: ["operation", "a", "b", "result"],
        additionalProperties: false,
      },
    },
    {
      name: "subtract",
      description: "Subtract the second number from the first.",
      inputSchema: baseInputSchema,
      outputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          a: { type: "number" },
          b: { type: "number" },
          result: { type: "number" },
        },
        required: ["operation", "a", "b", "result"],
        additionalProperties: false,
      },
    },
    {
      name: "multiply",
      description: "Multiply two numbers.",
      inputSchema: baseInputSchema,
      outputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          a: { type: "number" },
          b: { type: "number" },
          result: { type: "number" },
        },
        required: ["operation", "a", "b", "result"],
        additionalProperties: false,
      },
    },
    {
      name: "divide",
      description: "Divide the first number by the second.",
      inputSchema: baseInputSchema,
      outputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          a: { type: "number" },
          b: { type: "number" },
          result: { type: "number" },
        },
        required: ["operation", "a", "b", "result"],
        additionalProperties: false,
      },
    },
    {
      name: "power",
      description: "Raise the first number to the power of the second.",
      inputSchema: baseInputSchema,
      outputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          a: { type: "number" },
          b: { type: "number" },
          result: { type: "number" },
        },
        required: ["operation", "a", "b", "result"],
        additionalProperties: false,
      },
    },
    {
      name: "get_history",
      description: "Return the calculation history for this server process.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
      },
      outputSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            operation: { type: "string" },
            a: { type: "number" },
            b: { type: "number" },
            result: { type: "number" },
            timestamp: { type: "string" },
          },
          required: ["operation", "a", "b", "result", "timestamp"],
          additionalProperties: false,
        },
      },
    },
    {
      name: "clear_history",
      description: "Clear all stored calculation history for this server process.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          message: { type: "string" },
          cleared: { type: "number" },
        },
        required: ["message", "cleared"],
        additionalProperties: false,
      },
    },
  ];
}

function callTool(name, args) {
  switch (name) {
    case "add": {
      const a = toNumber(args.a, "a");
      const b = toNumber(args.b, "b");
      const result = a + b;
      const payload = { operation: "add", a, b, result };
      recordHistory(payload);
      return payload;
    }
    case "subtract": {
      const a = toNumber(args.a, "a");
      const b = toNumber(args.b, "b");
      const result = a - b;
      const payload = { operation: "subtract", a, b, result };
      recordHistory(payload);
      return payload;
    }
    case "multiply": {
      const a = toNumber(args.a, "a");
      const b = toNumber(args.b, "b");
      const result = a * b;
      const payload = { operation: "multiply", a, b, result };
      recordHistory(payload);
      return payload;
    }
    case "divide": {
      const a = toNumber(args.a, "a");
      const b = toNumber(args.b, "b");
      if (b === 0) {
        throw new Error("Division by zero is not allowed.");
      }
      const result = a / b;
      const payload = { operation: "divide", a, b, result };
      recordHistory(payload);
      return payload;
    }
    case "power": {
      const a = toNumber(args.a, "a");
      const b = toNumber(args.b, "b");
      const result = a ** b;
      const payload = { operation: "power", a, b, result };
      recordHistory(payload);
      return payload;
    }
    case "get_history":
      return history;
    case "clear_history": {
      const cleared = history.length;
      history.length = 0;
      return { message: "History cleared.", cleared };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function handleRequest(message) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return;
  }

  const { id, method, params } = message;
  const isNotification = id === undefined || id === null;

  if (method === "notifications/initialized") {
    initialized = true;
    return;
  }

  if (method === "initialize") {
    const requestedVersion = params?.protocolVersion;
    negotiatedProtocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
      ? requestedVersion
      : SUPPORTED_PROTOCOL_VERSIONS[0];

    if (requestedVersion && !SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)) {
      respondError(id, -32602, "Unsupported protocol version", {
        supported: SUPPORTED_PROTOCOL_VERSIONS,
        requested: requestedVersion,
      });
      return;
    }

    respond(id, {
      protocolVersion: negotiatedProtocolVersion,
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: {
        name: "calculator-mcp",
        title: "Calculator MCP Server",
        version: "1.0.0",
        description: "A simple calculator server with arithmetic tools and history support.",
      },
      instructions:
        "Use the calculator tools to perform arithmetic. History is stored in memory for the current process only.",
    });
    initialized = true;
    return;
  }

  if (isNotification) {
    return;
  }

  if (!initialized && method !== "ping" && method !== "initialize") {
    respondError(id, -32002, "Server has not been initialized");
    return;
  }

  if (method === "ping") {
    respond(id, {});
    return;
  }

  if (method === "tools/list") {
    respond(id, {
      tools: toolDefinitions(),
    });
    return;
  }

  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments ?? {};

    if (typeof name !== "string") {
      respondError(id, -32602, 'Missing required parameter "name"');
      return;
    }

    try {
      const result = callTool(name, args);
      respond(id, {
        content: [
          {
            type: "text",
            text: serialize(result),
          },
        ],
        structuredContent: result,
      });
    } catch (error) {
      respondError(id, -32602, error instanceof Error ? error.message : "Unknown error");
    }
    return;
  }

  respondError(id, -32601, `Method not found: ${method}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return;
  }

  try {
    const message = JSON.parse(trimmed);
    handleRequest(message);
  } catch (error) {
    process.stderr.write(
      `[calculator-mcp] Failed to parse message: ${error instanceof Error ? error.message : String(error)}\n`
    );
  }
});

rl.on("close", () => {
  process.exit(0);
});
