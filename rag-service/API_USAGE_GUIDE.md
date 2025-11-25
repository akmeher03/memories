# RAG API Usage Guide

## Overview

The RAG service provides two main endpoints:
1. **Store API** - Saves documents in Pinecone and returns confirmation
2. **Retrieve API** - Searches Pinecone and returns LLM-generated responses

## API Endpoints

### 1. Store Document: `/rag/store`

**Purpose**: Save document chunks as embeddings in Pinecone vector database.

**Request**:
```json
POST /rag/store
Content-Type: application/json

{
  "userId": "user123",
  "email": "email_001",
  "title": "Document Title",
  "content": "Your document content here..."
}
```

**Response** (Simplified):
```json
{
  "documentId": "email_001",
  "indexed": true
}
```

**Workflow**:
1. Receives document text
2. Splits into chunks using SentenceSplitter
3. Generates embeddings using Sentence Transformers
4. Stores vectors in Pinecone with user namespace
5. Returns simple confirmation with document ID

---

### 2. Retrieve Information: `/rag/retrieve`

**Purpose**: Search Pinecone for relevant chunks and get LLM-formatted response.

**Request**:
```json
POST /rag/retrieve
Content-Type: application/json

{
  "userId": "user123",
  "email": "email_001",
  "query": "What is the main topic discussed?",
  "topK": 5
}
```

**Response** (Simplified):
```json
{
  "answer": "Based on your documents, the main topic discussed is... [LLM-generated formatted answer with proper context and citations]",
  "score": 0.85
}
```

**Workflow**:
1. Receives user query
2. Generates embedding for the query
3. Searches Pinecone for similar vectors (semantic search)
4. Retrieves top matching document chunks
5. **NEW**: Passes retrieved context to Groq LLM
6. **NEW**: LLM generates well-formatted, contextual answer
7. Returns LLM response with source citations

---

## Complete Usage Example

### Python Code:
```python
import requests

BASE_URL = "http://localhost:8000"

# Step 1: Store a document
store_data = {
    "userId": "user123",
    "email": "ai_intro_001",
    "title": "Introduction to AI",
    "content": """
    Artificial Intelligence (AI) is transforming modern technology. 
    Machine learning, a subset of AI, enables computers to learn from data.
    Deep learning uses neural networks with multiple layers.
    """
}

store_response = requests.post(f"{BASE_URL}/rag/store", json=store_data)
print("Store Response:", store_response.json())
# Output: {"documentId": "ai_intro_001", "indexed": true}

# Step 2: Query the stored document
query_data = {
    "userId": "user123",
    "email": "ai_intro_001",
    "query": "What is machine learning?",
    "topK": 3
}

retrieve_response = requests.post(f"{BASE_URL}/rag/retrieve", json=query_data)
result = retrieve_response.json()

print("\nQuery:", result["query"])
print("Answer:", result["answer"])
print("\nSources:")
for source in result["sources"]:
    print(f"  [{source['source_number']}] {source['title']} (score: {source['relevance_score']:.2f})")
```

### Expected Output:
```
Store Response: {'documentId': 'ai_intro_001', 'indexed': True}

Answer: Machine learning is a subset of Artificial Intelligence (AI) that enables 
computers to learn from data without being explicitly programmed. It's one of the 
key technologies transforming modern technology, as mentioned in your document.

Score: 0.92
```

---

## Key Features

### Store API Features:
- ✅ **Simple Response**: Only returns `documentId` and `indexed` status
- ✅ **Automatic Chunking**: Splits long documents intelligently (1024 chars, 150 overlap)
- ✅ **User Isolation**: Each user's data stored in separate namespace
- ✅ **Fast Processing**: Batch embedding generation
- ✅ **CamelCase API**: Consistent with Java/JavaScript conventions

### Retrieve API Features:
- ✅ **Semantic Search**: Finds relevant chunks by meaning, not keywords
- ✅ **LLM-Enhanced Responses**: Groq LLM generates natural, formatted answers
- ✅ **Simple Response**: Returns `answer` and average `score`
- ✅ **Context Aggregation**: Combines multiple relevant chunks
- ✅ **Double-Layer Security**: Namespace + metadata filtering

---

## Configuration

### Environment Variables (`.env`):
```bash
# Pinecone
PINECONE_API_KEY=pcsk_xxxxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=rag-memories

# Embeddings
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

# LLM (NEW)
GROQ_API_KEY=gsk_xxxxx
GROQ_MODEL=llama3-70b-8192
```

### Get API Keys:
1. **Pinecone**: https://app.pinecone.io/
2. **Groq**: https://console.groq.com/

---

## Testing the APIs

### Using cURL:

**Store Document**:
```bash
curl -X POST http://localhost:8000/rag/store \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "email": "test_001",
    "title": "Test Document",
    "content": "Sample document content"
  }'
```

**Retrieve Information**:
```bash
curl -X POST http://localhost:8000/rag/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "email": "test_001",
    "query": "What is this about?",
    "topK": 5
  }'
```

---

## Error Handling

### Common Errors:

1. **No Results Found**:
```json
{
  "answer": "I couldn't find any relevant information in your documents to answer this question.",
  "score": 0.0
}
```

2. **Missing API Keys**:
```json
{
  "detail": "GROQ_API_KEY not found in environment variables"
}
```

3. **Empty Content**:
```json
{
  "detail": "Content cannot be empty"
}
```

---

## Performance Tips

1. **Optimal Chunk Size**: 1024 characters (fixed in code) works well for most documents
2. **Chunk Overlap**: 150 characters (fixed in code) ensures context continuity
3. **Top K**: Default is 10, adjust via `topK` parameter for broader/narrower context
4. **User Isolation**: Uses namespace `user_{userId}_{email}` for storage
5. **Search Namespace**: Searches `user_{userId}_{email}` for targeted retrieval
6. **Average Score**: Response score is average of all retrieved chunks' similarity scores

---

## Next Steps

1. Set up environment variables in `.env`
2. Install dependencies: `pip install -r requirements.txt`
3. Start the server: `uvicorn app.main:app --reload`
4. Test with the examples above
5. Monitor LLM token usage in responses

For detailed setup instructions, see `PINECONE_SETUP.md`.
