# Document AI Integration Troubleshooting

## Database Connection Issues

### **Error: "password authentication failed for user 'postgres'"**

This error occurs when the Document AI database connection fails. Here are the solutions:

### **Solution 1: Use Same Database as Main App**

The system now automatically uses your main database if no separate AI database is configured. Make sure your main database has the `pgvector` extension installed:

```sql
-- Connect to your main database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### **Solution 2: Configure Separate AI Database**

If you want a separate database for Document AI, add these to your `.env` file:

```env
# Document AI Database (separate from main)
AI_DB_USER=postgres
AI_DB_HOST=localhost
AI_DB_NAME=document_ai
AI_DB_PASSWORD=your_actual_password
AI_DB_PORT=5432
```

### **Solution 3: Check Database Credentials**

1. **Verify PostgreSQL is running:**
   ```bash
   # Windows
   net start postgresql-x64-15
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Test connection manually:**
   ```bash
   psql -h localhost -U postgres -d your_database_name
   ```

3. **Check your main database credentials in `.env`:**
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_PASSWORD=your_actual_password
   DB_PORT=5432
   ```

### **Solution 4: Install pgvector Extension**

The Document AI system requires the `pgvector` extension for storing embeddings:

```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

If you get an error about the extension not being available:

1. **Install pgvector:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-15-pgvector
   
   # macOS with Homebrew
   brew install pgvector
   
   # Windows - download from https://github.com/pgvector/pgvector/releases
   ```

2. **Restart PostgreSQL after installation**

### **Solution 5: Disable Document AI Temporarily**

If you want to disable Document AI features temporarily, the system will continue to work without them. The main document upload functionality will work normally.

## Environment Variables

### **Required Variables**

Make sure these are in your `.env` file:

```env
# Main Database (used as fallback for AI database)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_actual_password
DB_PORT=5432

# AI Provider (optional - defaults to xai)
AI_PROVIDER=xai

# AI API Keys (optional - AI features will be limited without them)
OPENAI_API_KEY=your_openai_key_here
XAI_API_KEY=your_xai_key_here
OLLAMA_BASE_URL=http://localhost:11434
```

## Testing the Integration

### **1. Check Database Connection**

Look for these messages in your server logs:

```
✅ Document AI database connected successfully
✅ Document AI database tables initialized
```

If you see:
```
⚠️  Document AI database not available - AI features will be disabled
```

Then the system is working but AI features are disabled.

### **2. Test Document Upload**

Upload a document and check the response:

```json
{
  "message": "Batch Upload Completed: 1 uploaded, 0 skipped, 0 failed. AI processing initiated for 1 documents.",
  "stats": {
    "uploaded": 1,
    "aiProcessed": 1,
    "aiFailed": 0
  }
}
```

### **3. Check AI Processing Status**

```bash
curl -X GET "http://localhost:3000/api/v1/documents/{documentId}/ai/status" \
  -H "Authorization: Bearer your_token"
```

## Common Issues and Solutions

### **Issue: "Document AI database not available"**

**Cause:** Database connection failed
**Solution:** Check database credentials and ensure PostgreSQL is running

### **Issue: "pgvector extension not found"**

**Cause:** pgvector extension not installed
**Solution:** Install pgvector extension in your database

### **Issue: "AI processing failed"**

**Cause:** AI provider not configured or API keys missing
**Solution:** Configure AI provider and add API keys

### **Issue: "No content extracted"**

**Cause:** Unsupported file type or corrupted file
**Solution:** Check file type (supports PDF, TXT, CSV, DOCX) and file integrity

## Performance Considerations

### **Database Performance**

- The Document AI system creates additional tables in your database
- Embeddings can be large - ensure adequate storage
- Consider using a separate database for large-scale deployments

### **Processing Performance**

- AI processing happens asynchronously
- Large documents are chunked to prevent timeouts
- Processing is limited to 15 chunks per document by default

## Monitoring

### **Check AI Processing Statistics**

```bash
curl -X GET "http://localhost:3000/api/v1/documents/ai/stats" \
  -H "Authorization: Bearer your_token"
```

### **Server Logs**

Watch for these log messages:
- `✅ AI processing completed for filename.pdf`
- `❌ AI processing failed for filename.pdf`
- `⚠️  Document AI database not available`

## Getting Help

If you're still having issues:

1. Check the server logs for detailed error messages
2. Verify your database connection manually
3. Test with a simple document upload first
4. Ensure all required extensions are installed

The system is designed to gracefully handle failures - your main application will continue to work even if Document AI features are disabled. 