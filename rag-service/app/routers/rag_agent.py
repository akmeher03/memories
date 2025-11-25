import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import Document

from services.embedding_service import get_embedding_service
from services.pinecone_service import get_pinecone_service
from services.llm_service import get_llm_service

router = APIRouter()

# Create a logger
logger = logging.getLogger(__name__)

# Initialize services (loaded once at startup)
embedding_service = get_embedding_service()
pinecone_service = get_pinecone_service(dimension=384)  # Must match embedding model dimension
llm_service = get_llm_service()  # Initialize LLM service for response generation




class RagStoreRequest(BaseModel):
    userId: str
    email: str
    title: str
    content: str

class RagStoreResponse(BaseModel):
    documentId: str
    indexed: bool = False

class RagRetrieveRequest(BaseModel):
    userId: str
    email: str
    query: str
    topK: int = Field(default=10, description="Number of top relevant documents to retrieve")

class RagRetrieveResponse(BaseModel):
    answer: str
    score: float



@router.post("/rag/store", response_model=RagStoreResponse, summary="Store data in RAG system")
def store_rag_data(request: RagStoreRequest) -> RagStoreResponse:
    """
    Endpoint to store data in the RAG system.
    
    This endpoint performs the following steps:
    1. Validates the input content
    2. Splits text into semantic chunks using SentenceSplitter
    3. Creates Document objects with metadata
    4. Generates embeddings for each chunk
    5. Prepares data for vector database storage
    
    The embeddings are dense vector representations that capture semantic meaning,
    enabling similarity-based retrieval for question answering.
    """
    try:
        print(f"[INFO] Storing document for user: {request.userId}, email: {request.email}")
        
        # Validate content
        if not request.content or len(request.content.strip()) == 0:
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        # STEP 1: Split text into semantic chunks
        print("[INFO] Step 1: Splitting text into chunks")
        splitter = SentenceSplitter(chunk_size=1024, chunk_overlap=150)
        chunks = splitter.split_text(request.content)
        print(f"[INFO] Created {len(chunks)} chunks")
        
        # STEP 2: Create nodes with essential metadata
        print("[INFO] Step 2: Creating nodes with metadata")
        nodes = []
        timestamp = datetime.now().isoformat()
        
        for idx, chunk in enumerate(chunks):
            doc = Document(
                text=chunk,
                extra_info={
                    "user_id": request.userId,
                    "email_id": request.email,
                    "title": request.title,
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "timestamp": timestamp,
                    "source_type": "email",
                    "chunk_length": len(chunk),
                    "word_count": len(chunk.split())
                }
            )
            nodes.append(doc)
        
        # Convert to nodes
        nodes = splitter.get_nodes_from_documents(nodes)
        print(f"[INFO] Generated {len(nodes)} nodes")
        
        # STEP 4: Generate Embeddings (Convert text to numbers for semantic search)
        # The embedding service automatically converts each chunk into a 384-dimensional vector
        # These vectors capture the semantic meaning, allowing us to find similar content later
        print("[INFO] Step 4: Generating embeddings (converting text to semantic vectors)")
        node_texts = [node.get_content() for node in nodes]
        embeddings = embedding_service.embed_texts_while_storing(node_texts)  # Service handles batching automatically
        print(f"[INFO] Generated {len(embeddings)} embeddings (384 dimensions each), embeddings is {embeddings[:1]}")
        
        # STEP 5: Store in Pinecone with Security Isolation
        # The service automatically handles:
        # - Namespace creation (user_123_email001) for complete isolation
        # - Metadata addition (user_id, email_id, title, text)
        # - Vector formatting and batching
        # - Double-layer security (namespace + metadata filter)
        print("[INFO] Step 5: Storing in Pinecone with automatic security isolation")
        
        storage_result = pinecone_service.store_documents(
            nodes=nodes,
            embeddings=embeddings,
            user_id=request.userId,
            email_id=request.email,
            title=request.title
        )
        
        print(f"[INFO] Successfully stored {storage_result['vectors_stored']} vectors in namespace: {storage_result['namespace']}")
        
        # Generate document ID (use email as the primary document identifier)
        return RagStoreResponse(
            documentId=request.email,
            indexed=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error storing data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to store data: {str(e)}")



@router.post("/rag/query", response_model=RagRetrieveResponse, summary="Retrieve data from RAG system")
def retrieve_rag_data(request: RagRetrieveRequest) -> RagRetrieveResponse:
    """
    Endpoint to retrieve data from the RAG system using semantic search.
    
    This endpoint performs the following steps:
    1. Validates the query
    2. Generates embedding for the query
    3. Performs similarity search in vector database
    4. Returns top-k most relevant chunks
    
    In production, this would query a vector database. For now, it demonstrates
    the embedding generation process.
    """
    try:
        print(f"[INFO] Retrieving RAG data for user: {request.userId} with query: {request.query}")
        
        # Validate query
        if not request.query or len(request.query.strip()) == 0:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # STEP 1: Generate Query Embedding (Convert question to searchable vector)
        print("[INFO] Step 1: Converting query to semantic vector")
        query_embedding = embedding_service.embed_text_while_searching(request.query)  # Simple call, auto 384-dim
        print(f"[INFO] Query converted to {len(query_embedding)}-dimensional vector")
        
        # STEP 2: Search Pinecone with Double-Layer Security
        print("[INFO] Step 2: Searching Pinecone with security filters")
        
        # SECURITY LAYER 1: Namespace Isolation
        # Only search in this user's private namespace
        namespace = f"user_{request.userId}_{request.email}"
        print(f"[INFO] Searching in secure namespace: {namespace}")
        
        # SECURITY LAYER 2: Metadata Filter
        # Even within namespace, filter by user_id as backup security
        # This double-layer approach ensures 100% data isolation
        pinecone_results = pinecone_service.query_vectors(
            query_vector=query_embedding,
            top_k=request.topK,
            filter_metadata={"user_id": request.userId},  # CRITICAL: Only return this user's data
            namespace=namespace,  # CRITICAL: Search only in user's namespace
            include_metadata=True,
            include_values=False  # Don't return vectors to save bandwidth
        )
        
        print(f"[INFO] Retrieved {len(pinecone_results)} results from Pinecone")
        
        # Check if any results were found
        if not pinecone_results:
            return RagRetrieveResponse(
                answer="I couldn't find any relevant information in your documents to answer this question.",
                score=0.0
            )
        
        # Format context chunks for LLM
        context_chunks = []
        for match in pinecone_results:
            metadata = match.get("metadata", {})
            context_chunks.append({
                "score": match["score"],
                "title": metadata.get("title", "Untitled"),
                "text": metadata.get("text", ""),
                "timestamp": metadata.get("timestamp", ""),
                "email_id": metadata.get("email_id", ""),
                "chunk_index": metadata.get("chunk_index", 0)
            })
        
        # STEP 3: Generate response using LLM
        print("[INFO] Step 3: Generating formatted response with LLM")
        llm_response = llm_service.generate_response(
            query=request.query,
            context_chunks=context_chunks,
            temperature=0.3,
            max_tokens=1024
        )
        
        print(f"[INFO] LLM response generated. Tokens used: {llm_response['usage']['total_tokens']}")
        
        # Calculate average score from top results
        print("[INFO] Calculating average score from retrieved chunks, context_chunks is", context_chunks)
        average_score = sum(chunk["score"] for chunk in context_chunks) / len(context_chunks) if context_chunks else 0.0
        
        return RagRetrieveResponse(
            answer=llm_response["answer"],
            score=round(average_score, 4)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error retrieving RAG data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve data: {str(e)}")