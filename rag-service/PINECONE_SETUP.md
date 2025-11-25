# Pinecone Setup Guide for RAG Service

This guide will help you set up Pinecone vector database for your RAG (Retrieval-Augmented Generation) service.

## Prerequisites

- Python 3.8+
- Pinecone account (free tier available)
- All dependencies installed from `requirements.txt`

## Step 1: Create a Pinecone Account

1. Go to [https://www.pinecone.io/](https://www.pinecone.io/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your API Key

1. Log in to the Pinecone console
2. Navigate to **API Keys** in the left sidebar
3. Copy your API key (looks like: `pcsk_xxxxx...`)
4. Note your environment (e.g., `gcp-starter`, `us-east1-gcp`, `us-west1-aws`)

## Step 3: Configure Environment Variables

Edit your `.env` file in the project root and add:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_actual_api_key_here
PINECONE_ENVIRONMENT=gcp-starter  # or your environment
PINECONE_INDEX_NAME=rag-memories

# Embedding Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

# Groq LLM Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192
```

### Important Notes:

- **PINECONE_API_KEY**: Replace with your actual API key from Step 2 ([Get it here](https://app.pinecone.io/))
- **PINECONE_ENVIRONMENT**: Use the environment shown in your Pinecone console
- **PINECONE_INDEX_NAME**: Name for your vector index (created automatically)
- **EMBEDDING_DIMENSION**: Must match your embedding model (384 for all-MiniLM-L6-v2)
- **GROQ_API_KEY**: Get your free API key from [Groq Console](https://console.groq.com/)
- **GROQ_MODEL**: llama3-70b-8192 recommended for fast, accurate responses

## Step 4: Verify Installation

Run this test to verify Pinecone is configured correctly:

```bash
python -c "from app.services.pinecone_service import get_pinecone_service; service = get_pinecone_service(); print('✓ Pinecone connected successfully!')"
```

## Step 5: Understanding Index Creation

The service will automatically create a Pinecone index with these settings:

- **Name**: `rag-memories` (or your configured name)
- **Dimension**: 384 (matching the embedding model)
- **Metric**: Cosine similarity
- **Type**: Serverless (free tier compatible)
- **Region**: AWS us-east-1 (or your configured region)

The index is created automatically when you first run the service.

## Step 6: Test the RAG Endpoints

### Store Data

```bash
curl -X POST "http://localhost:8000/rag/store" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "email": "test_email_456",
    "title": "Test Document",
    "content": "This is a test document about machine learning and artificial intelligence. Machine learning is a subset of AI that focuses on training algorithms to learn from data."
  }'
```

Expected response:
```json
{
  "documentId": "test_email_456",
  "indexed": true
}
```

### Retrieve Data

```bash
curl -X POST "http://localhost:8000/rag/retrieve" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "email": "test_email_456",
    "query": "Tell me about machine learning",
    "topK": 3
  }'
```

Expected response:
```json
{
  "answer": "Machine learning is a subset of artificial intelligence that focuses on training algorithms to learn from data and make predictions or decisions without being explicitly programmed...",
  "score": 0.85
}
```

## Architecture Overview

### Data Flow - Storage

```
User Request
    ↓
Text Chunking (SentenceSplitter)
    ↓
Document Creation with Metadata
    ↓
Node Generation
    ↓
Embedding Generation (384-dim vectors)
    ↓
Pinecone Storage (with user namespace)
```

### Data Flow - Retrieval

```
User Query
    ↓
Query Embedding Generation (384-dim)
    ↓
Pinecone Vector Search (cosine similarity)
    ↓
Metadata Filtering (user_id + namespace)
    ↓
Top-K Results Retrieved
    ↓
Groq LLM Processing (llama3-70b-8192)
    ↓
Formatted Answer + Average Score Returned
```

## Key Features

### 1. **Data Isolation via Namespaces**
- Each user's documents are stored in separate namespaces: `user_{userId}_{email}`
- Ensures users can only query their own data
- Provides multi-tenancy support with document-level isolation

### 2. **Metadata Filtering**
- Additional security layer beyond namespaces
- Filter by `user_id`, `source_type`, `timestamp`, etc.
- Enables complex queries like "emails from last week about AI"

### 3. **Batch Operations**
- Vectors are upserted in batches of 100 for efficiency
- Reduces API calls and improves performance
- Configurable batch size

### 4. **Automatic Index Management**
- Index is created automatically if it doesn't exist
- No manual setup required
- Safe to run multiple times

## Monitoring & Debugging

### Check Index Statistics

```python
from app.services.pinecone_service import get_pinecone_service

service = get_pinecone_service()
stats = service.get_index_stats()
print(stats)
```

Output:
```python
{
  'total_vector_count': 150,
  'dimension': 384,
  'index_fullness': 0.001,
  'namespaces': {
    'user_test_user_123': {'vector_count': 50},
    'user_another_user': {'vector_count': 100}
  }
}
```

### Common Issues & Solutions

#### Issue: "API key not found"
**Solution**: Verify `.env` file has `PINECONE_API_KEY` set correctly

#### Issue: "Dimension mismatch"
**Solution**: Ensure `EMBEDDING_DIMENSION=384` matches your model

#### Issue: "No results returned"
**Solution**: 
- Check if vectors were actually stored
- Verify user_id matches between store and retrieve
- Check namespace configuration

#### Issue: "Rate limit exceeded"
**Solution**: 
- Free tier has limits on queries per second
- Implement request throttling
- Consider upgrading to paid tier

## Cost Optimization

### Free Tier Limits (as of 2024)
- 1 index
- 100K vectors
- 5 GB storage
- No expiration

### Best Practices
1. **Use namespaces** instead of multiple indexes
2. **Batch operations** to reduce API calls
3. **Delete old vectors** to stay within limits
4. **Monitor usage** via Pinecone console

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Implement user authentication** before allowing access
4. **Validate user_id** on all requests
5. **Use namespaces** for data isolation
6. **Add metadata filtering** as second layer of security

## Next Steps

1. ✅ Configure Pinecone credentials
2. ✅ Configure Groq API key for LLM
3. ✅ Test storage endpoint
4. ✅ Test retrieval endpoint with LLM responses
5. ✅ Verify camelCase API compatibility with microservices
6. 🔲 Add authentication/authorization
7. 🔲 Implement rate limiting
8. 🔲 Add monitoring and analytics
9. 🔲 Deploy to production

## Useful Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [Pinecone Python Client](https://github.com/pinecone-io/pinecone-python-client)
- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [Sentence Transformers](https://www.sbert.net/)

## Support

For issues:
1. Check the logs: `tail -f app.log`
2. Verify Pinecone console for index status
3. Test with the example commands above
4. Review this guide's troubleshooting section

---

**You're all set!** Your RAG service is now connected to Pinecone and ready to store and retrieve embeddings.
