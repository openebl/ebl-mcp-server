# EBL MCP Server

This project implements a **Model Context Protocol (MCP)** server to manage electronic Bills of Lading (eBLs). It provides functionalities to issue, query, transfer, and surrender eBLs.

## Technology Stack

*   **Language:** TypeScript
*   **Package Manager:** pnpm
*   **Runtime:** Node.js
*   **Framework:** @modelcontextprotocol/sdk

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

We welcome contributions to improve the EBL MCP Server! Please follow these guidelines to ensure a smooth collaboration:

### Development Workflow

1. Fork the repository and create a feature branch from `main`
2. Install dependencies with `pnpm install`
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Run tests to ensure everything works as expected
6. Submit a pull request

### Coding Standards

- Write TypeScript code with proper type definitions
- Follow functional programming paradigms; avoid using classes
- Ensure all functions are pure and side-effect free when possible
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Structure files: exported component, subcomponents, helpers, static content
- Implement comprehensive error handling using @modelcontextprotocol/sdk's mechanisms

### Pull Request Process

1. Update documentation to reflect any changes
2. Ensure code passes all tests
3. Get approval from at least one maintainer
4. Maintain clean commit history with meaningful commit messages

### Reporting Issues

If you find a bug or have a feature request, please create an issue providing:
- A clear description of the problem/request
- Steps to reproduce (for bugs)
- Expected and actual behavior (for bugs)
- Any relevant logs or screenshots

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.

## Samples

### Issue eBL
```json
{
  "method": "tools/call",
  "params": {
    "name": "issue_ebl",
    "arguments": {
      "requester_bu_id": "did:openebl:3993ace7-eb6c-4a1f-bed8-121643a278c9",
      "file_content": {
        "url": "https://flash-store.kevin-a65.workers.dev/file/pStQB1tvsV89Ms6AhImTQQ"
      },
      "bl_number": "BL-20250417-12999",
      "bl_doc_type": "HouseBillOfLading",
      "pol": {
        "locationName": "YanTian",
        "UNLocationCode": "CNYTN"
      },
      "pod": {
        "locationName": "LA",
        "UNLocationCode": "USLAX"
      },
      "shipper": "did:openebl:d2856f4e-e636-4cf0-9110-fbb45304e614",
      "consignee": "did:openebl:0158341d-5c6b-4121-bfe4-535c7606bbd5",
      "release_agent": "did:openebl:66c71465-3d0b-43d8-9e1b-c88c7a7634ca",
      "draft": false,
      "to_order": false,
      "eta": "2025-05-01",
      "endorsee": "",
      "notify_parties": [],
      "note": "Test from MCP",
      "encrypt_content": false
    },
    "_meta": {
      "progressToken": 11
    }
  }
}
```
