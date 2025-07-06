# Document AI Controller Integration

This document describes the integration of a Document AI controller into the main KeSMIS system.

## Overview

The Document AI controller provides AI-powered document processing and question-answering capabilities. It supports multiple AI providers (OpenAI, XAI/Grok, Ollama) and can process various document formats (PDF, TXT, CSV, DOCX).

## Features

- **Multi-format Document Support**: PDF, TXT, CSV, DOCX
- **Multiple AI Providers**: OpenAI, XAI/Grok, Ollama
- **Semantic Search**: Vector embeddings for intelligent document search
- **Conversation History**: Track and manage chat sessions
- **Document Management**: Upload, delete, and manage documents
- **Statistics**: Monitor system usage and performance

## Installation

1. Install the required dependencies:
```bash
npm install
```

2. Set up environment variables in your `.env.kisip` file:
```env
# AI Provider Configuration
AI_PROVIDER=xai  # or 'openai', 'ollama'

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# XAI Configuration
XAI_API_KEY=your_xai_api_key_here
XAI_MODEL=grok-3-mini-fast

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Database Configuration (if using separate database for Document AI)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=document_ai
DB_PASSWORD=password
DB_PORT=5432

# Optional Settings
DISABLE_EMBEDDINGS=false
CHUNK_SIZE=1200
OVERLAP_SIZE=200
MAX_DOCUMENT_SIZE=104857600
MAX_TOTAL_CHUNKS=20
MAX_CHUNKS_PER_DOCUMENT=15
```

## API Endpoints

### Document Management

- `GET /api/document-ai/documents` - Get list of uploaded documents
- `POST /api/document-ai/upload` - Upload a document for processing
- `DELETE /api/document-ai/documents/:filename` - Delete a document

### AI Interaction

- `POST /api/document-ai/ask` - Ask questions about uploaded documents
- `GET /api/document-ai/history/:sessionId` - Get conversation history
- `DELETE /api/document-ai/history/:sessionId` - Clear conversation history

### System Management

- `GET /api/document-ai/stats` - Get system statistics
- `GET /api/document-ai/health` - Check system health
- `GET /api/document-ai/models` - Get available AI models
- `POST /api/document-ai/provider` - Change AI provider
- `GET /api/document-ai/debug/database` - Get debug information

## Usage Examples

### Upload a Document

```javascript
const formData = new FormData();
formData.append('document', file);

const response = await fetch('/api/document-ai/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Ask a Question

```javascript
const response = await fetch('/api/document-ai/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    question: "What are the main topics discussed in the documents?",
    sessionId: "user123",
    model: "grok-3-mini-fast"
  })
});
```

### Get Documents

```javascript
const response = await fetch('/api/document-ai/documents', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Permissions

The following permissions are required for different operations:

- `document:read` - Read documents, ask questions, view history
- `document:create` - Upload documents
- `document:update` - Change AI provider
- `document:delete` - Delete documents, clear history

## Database Schema

The controller creates the following tables:

- `documents` - Stores document metadata and content
- `document_chunks` - Stores document chunks for processing
- `embeddings` - Stores vector embeddings for semantic search
- `conversations` - Stores conversation history

## Configuration

### AI Provider Selection

You can switch between AI providers using the `/api/document-ai/provider` endpoint:

```javascript
await fetch('/api/document-ai/provider', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    provider: 'xai' // or 'openai', 'ollama'
  })
});
```

### Embeddings Configuration

- **OpenAI**: Uses `text-embedding-ada-002` model
- **XAI**: Uses Ollama embeddings (if available) or OpenAI embeddings
- **Ollama**: Uses `all-minilm` model for embeddings

## Error Handling

The controller includes comprehensive error handling:

- File size limits (100MB default)
- Supported file type validation
- Database connection errors
- AI provider connection errors
- Embedding generation failures

## Monitoring

Use the health check endpoint to monitor system status:

```javascript
const health = await fetch('/api/document-ai/health', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Troubleshooting

### Common Issues

1. **Embeddings not working**: Check if your AI provider API key is valid
2. **Database connection errors**: Verify PostgreSQL connection settings
3. **File upload failures**: Check file size and format restrictions
4. **AI provider errors**: Verify API keys and model availability

### Debug Information

Use the debug endpoint to get detailed system information:

```javascript
const debug = await fetch('/api/document-ai/debug/database', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Integration Notes

- The controller follows the existing project structure and patterns
- All endpoints require authentication and appropriate permissions
- Swagger documentation is automatically generated
- The controller integrates with the existing middleware and authentication system

## Security Considerations

- All endpoints require JWT authentication
- File uploads are validated for type and size
- SQL injection protection through parameterized queries
- XSS protection through input validation
- Rate limiting can be added through existing middleware 