# EBL MCP Server

This project implements a server compliant with Maritime Connectivity Platform (MCP) principles to manage electronic Bills of Lading (eBLs). It provides functionalities to issue, query, transfer, and surrender eBLs.

## Technology Stack

*   **Language:** TypeScript
*   **Package Manager:** pnpm
*   **Runtime:** Node.js
*   **Framework:** (To be decided - e.g., Express, Fastify)

## Core Features

*   **Issue eBL:** Create and register a new electronic Bill of Lading.
*   **Query eBL:** Retrieve details of existing eBLs.
*   **Transfer eBL:** Change the holder/owner of an eBL.
*   **Surrender eBL:** Mark an eBL as surrendered, typically upon cargo delivery.

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   pnpm (Install via `npm install -g pnpm`)

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd ebl-mcp-server
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Running the Server

*   **Development Mode:**
    ```bash
    pnpm dev
    ```
*   **Production Mode:**
    ```bash
    pnpm build
    pnpm start
    ```
    *(Note: Build and start scripts need to be defined in `package.json`)*

## Project Structure (Initial Idea)

```
ebl-mcp-server/
├── src/
│   ├── index.ts         # Main application entry point
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models/interfaces (e.g., eBL structure)
│   ├── middleware/      # Custom middleware (auth, logging, etc.)
│   └── config/          # Configuration files
├── test/                # Unit and integration tests
├── .env.example         # Environment variable template
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── README.md            # This file
└── PLAN.md              # Development plan
```

## Contributing

(Details on how to contribute will be added here)

## License

(License information will be added here)
