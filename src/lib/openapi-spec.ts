/** OpenAPI 3.0 document for App Router JSON/stream APIs under `/api`. */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "User management API",
    version: "1.0.0",
    description:
      "Session cookie (`um_session`) is set by `/api/auth/login` and `/api/auth/signup`. " +
      "Send cookies from the browser or use tools that persist cookies between requests.",
  },
  servers: [{ url: "/", description: "Current origin" }],
  tags: [
    { name: "auth", description: "Sign-in and session" },
    { name: "users", description: "User listing and profiles" },
    { name: "chat", description: "Streaming AI chat (Vercel AI SDK UI protocol)" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "um_session",
        description: "HTTP-only session cookie issued after login or signup.",
      },
    },
    schemas: {
      ErrorBody: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
      OkBody: {
        type: "object",
        properties: { ok: { type: "boolean", enum: [true] } },
        required: ["ok"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "member"] },
          created_at: { type: "integer", format: "int64" },
          first_name: { type: "string", nullable: true },
          last_name: { type: "string", nullable: true },
          date_of_birth: {
            type: "string",
            nullable: true,
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          },
          bio: { type: "string", nullable: true },
        },
        required: [
          "id",
          "name",
          "email",
          "role",
          "created_at",
          "first_name",
          "last_name",
          "date_of_birth",
          "bio",
        ],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1, maxLength: 256 },
        },
        required: ["email", "password"],
      },
      LoginSuccess: {
        type: "object",
        properties: {
          ok: { type: "boolean", enum: [true] },
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["ok", "user"],
      },
      SignupRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
          email: { type: "string", format: "email", maxLength: 255 },
          password: { type: "string", minLength: 8, maxLength: 256 },
        },
        required: ["name", "email", "password"],
      },
      SignupSuccess: {
        type: "object",
        properties: {
          ok: { type: "boolean", enum: [true] },
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["ok", "user"],
      },
      MeResponse: {
        type: "object",
        properties: {
          user: {
            oneOf: [{ $ref: "#/components/schemas/User" }, { type: "null" }],
          },
          error: { type: "string", description: "Present when DB unavailable." },
        },
        required: ["user"],
      },
      UsersListResponse: {
        type: "object",
        properties: {
          users: {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          },
        },
        required: ["users"],
      },
      UserOneResponse: {
        type: "object",
        properties: { user: { $ref: "#/components/schemas/User" } },
        required: ["user"],
      },
      ChatRequest: {
        type: "object",
        description:
          "Vercel AI SDK UI messages payload. Prefer the app UI or `@ai-sdk/react`; " +
          "shape is an array of UI message parts.",
        properties: {
          messages: {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
        },
        required: ["messages"],
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Log in",
        description:
          "Validates email/password and sets `um_session`. Rejects if already signed in.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated; session cookie set.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginSuccess" },
              },
            },
          },
          "400": {
            description: "Invalid input or already signed in.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "401": {
            description: "Invalid credentials.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "500": {
            description: "Database or configuration error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "503": {
            description: "Database unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
        },
      },
    },
    "/api/auth/signup": {
      post: {
        tags: ["auth"],
        summary: "Register",
        description:
          "Creates an account; first user becomes admin. Sets session cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Registered; session cookie set.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignupSuccess" },
              },
            },
          },
          "400": {
            description: "Validation error or already signed in.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "409": {
            description: "Email conflict.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "500": {
            description: "Database or configuration error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "503": {
            description: "Database unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["auth"],
        summary: "Log out",
        description: "Clears server session and deletes `um_session` cookie.",
        responses: {
          "200": {
            description: "Logged out.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OkBody" },
              },
            },
          },
          "500": {
            description: "Database or configuration error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "503": {
            description: "Database unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Current user",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Session user or null when anonymous.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
          "503": {
            description: "Database unavailable (`user` may be null, `error` set).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["users"],
        summary: "List users",
        description: "Admin only.",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "All users.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UsersListResponse" },
              },
            },
          },
          "401": {
            description: "Not authenticated.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "403": {
            description: "Not an admin.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "500": {
            description: "Server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "503": {
            description: "Database unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["users"],
        summary: "Get user by id",
        description: "Admins: any id. Members: only their own id.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserOneResponse" },
              },
            },
          },
          "401": {
            description: "Not authenticated.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "403": {
            description: "Forbidden for this user.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "404": {
            description: "User not found.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "503": {
            description: "Database unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
        },
      },
    },
    "/api/chat": {
      post: {
        tags: ["chat"],
        summary: "Streaming assistant chat",
        description:
          "Requires `OPENAI_API_KEY` (or optional header `x-openai-api-key`). " +
          "Returns a UI message stream (`text/event-stream` style per AI SDK), not plain JSON.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "x-openai-api-key",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Overrides server/env OpenAI API key.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChatRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Streaming AI SDK UI response.",
            content: {
              "text/event-stream": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          "400": {
            description: "Invalid JSON body.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "401": {
            description: "Not authenticated.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "500": {
            description: "Missing API key or server error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
          "503": {
            description: "Database unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorBody" },
              },
            },
          },
        },
      },
    },
  },
} as const;
