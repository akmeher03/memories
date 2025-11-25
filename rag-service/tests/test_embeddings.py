"""
Test script to demonstrate the embedding functionality in the RAG system.

This script shows:
1. How text is split into chunks
2. How embeddings are generated for each chunk
3. How similarity search works with embeddings
4. Complete example of the storage workflow
"""

import sys
import os

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.embedding_service import get_embedding_service
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import Document
from datetime import datetime
import json


def test_embedding_generation():
    """Test basic embedding generation."""
    print("\n" + "="*80)
    print("TEST 1: BASIC EMBEDDING GENERATION")
    print("="*80 + "\n")
    
    # Initialize the embedding service
    print("Initializing embedding service...")
    service = get_embedding_service()
    
    # Get model info
    model_info = service.get_model_info()
    print(f"\nModel Information:")
    print(f"  Model Name: {model_info['model_name']}")
    print(f"  Embedding Dimension: {model_info['embedding_dimension']}")
    print(f"  Max Sequence Length: {model_info['max_sequence_length']}")
    
    # Generate embedding for a single text
    sample_text = "Machine learning is a subset of artificial intelligence."
    print(f"\n\nGenerating embedding for: '{sample_text}'")
    
    embedding = service.embed_text(sample_text)
    
    print(f"\nEmbedding generated successfully!")
    print(f"  Embedding dimension: {len(embedding)}")
    print(f"  First 10 values: {embedding[:10]}")
    print(f"  Embedding type: {type(embedding)}")
    print(f"  Value range: [{min(embedding):.4f}, {max(embedding):.4f}]")


def test_batch_embeddings():
    """Test batch embedding generation."""
    print("\n" + "="*80)
    print("TEST 2: BATCH EMBEDDING GENERATION")
    print("="*80 + "\n")
    
    service = get_embedding_service()
    
    texts = [
        "Artificial intelligence is transforming the technology industry.",
        "Climate change requires immediate global action.",
        "Quantum computing promises to revolutionize data processing.",
        "Renewable energy sources are becoming more cost-effective.",
        "Machine learning models require large amounts of training data."
    ]
    
    print(f"Generating embeddings for {len(texts)} texts:")
    for i, text in enumerate(texts, 1):
        print(f"  {i}. {text}")
    
    print("\nProcessing...")
    embeddings = service.embed_texts(texts, batch_size=5, show_progress=True)
    
    print(f"\n✓ Generated {len(embeddings)} embeddings")
    print(f"  Each embedding has {len(embeddings[0])} dimensions")
    
    # Show size estimate
    total_floats = len(embeddings) * len(embeddings[0])
    size_bytes = total_floats * 4  # 4 bytes per float32
    print(f"  Total storage size: ~{size_bytes / 1024:.2f} KB")


def test_similarity_search():
    """Test similarity computation between embeddings."""
    print("\n" + "="*80)
    print("TEST 3: SIMILARITY SEARCH")
    print("="*80 + "\n")
    
    service = get_embedding_service()
    
    # Query and candidate documents
    query = "Tell me about machine learning and AI"
    
    documents = [
        "Artificial intelligence and machine learning are transforming industries.",
        "The weather forecast predicts rain for tomorrow.",
        "Deep learning uses neural networks with multiple layers.",
        "Italian cuisine is known for pasta and pizza.",
        "Natural language processing enables computers to understand human language."
    ]
    
    print(f"Query: '{query}'\n")
    print("Searching through documents:")
    for i, doc in enumerate(documents, 1):
        print(f"  {i}. {doc}")
    
    # Generate embeddings
    print("\n\nGenerating embeddings...")
    query_embedding = service.embed_text(query)
    doc_embeddings = service.embed_texts(documents)
    
    # Find most similar
    print("\nFinding most similar documents...")
    results = service.find_most_similar(query_embedding, doc_embeddings, top_k=3)
    
    print("\n\nTop 3 Most Similar Documents:")
    print("-" * 80)
    for rank, result in enumerate(results, 1):
        idx = result['index']
        similarity = result['similarity']
        print(f"\nRank {rank}:")
        print(f"  Similarity Score: {similarity:.4f} (0-1 scale)")
        print(f"  Document: {documents[idx]}")
    
    print("\n" + "-" * 80)
    print("\nObservations:")
    print("  • Documents about AI/ML have high similarity scores")
    print("  • Unrelated documents (weather, food) have lower scores")
    print("  • Similarity reflects semantic meaning, not just keyword matching")


def test_full_rag_workflow():
    """Test the complete RAG storage workflow with embeddings."""
    print("\n" + "="*80)
    print("TEST 4: COMPLETE RAG STORAGE WORKFLOW WITH EMBEDDINGS")
    print("="*80 + "\n")
    
    service = get_embedding_service()
    
    # Simulated API request
    email_content = """
    Subject: Product Launch Strategy for Q1 2024
    
    Team,
    
    I'm excited to share our product launch strategy for the upcoming quarter. 
    We've identified three key initiatives that will drive our market expansion.
    
    First, we're introducing an advanced analytics dashboard that provides real-time 
    insights into customer behavior. This feature leverages machine learning algorithms 
    to predict user preferences and recommend personalized content. The backend 
    infrastructure uses Apache Kafka for data streaming and Redis for caching.
    
    Second, we're rolling out a mobile application with offline capabilities. Users 
    will be able to access their data even without internet connectivity, with 
    automatic synchronization when they come back online. We're using React Native 
    for cross-platform development.
    
    Third, we're implementing enhanced security features including two-factor 
    authentication, end-to-end encryption, and automated threat detection. These 
    improvements will help us meet enterprise compliance requirements.
    
    The timeline is aggressive but achievable. Development starts next week, with 
    beta testing in February and general availability in March.
    
    Let's discuss this in our Monday meeting.
    
    Best,
    Sarah
    """
    
    print("INCOMING REQUEST:")
    print("-" * 80)
    print(f"User ID: user_12345")
    print(f"Email ID: email_67890")
    print(f"Title: Product Launch Strategy for Q1 2024")
    print(f"Content Length: {len(email_content)} characters")
    print("-" * 80)
    
    # STEP 1: Text Chunking
    print("\n\nSTEP 1: TEXT CHUNKING")
    print("-" * 80)
    splitter = SentenceSplitter(chunk_size=512, chunk_overlap=100)
    chunks = splitter.split_text(email_content)
    print(f"✓ Split into {len(chunks)} chunks")
    print(f"  Chunk size: 512 characters")
    print(f"  Overlap: 100 characters")
    
    print("\nChunk preview:")
    for i, chunk in enumerate(chunks[:2]):  # Show first 2 chunks
        print(f"\n  Chunk {i+1} ({len(chunk)} chars):")
        print(f"  {chunk[:150]}...")
    
    # STEP 2: Document Creation
    print("\n\nSTEP 2: DOCUMENT CREATION WITH METADATA")
    print("-" * 80)
    documents = []
    for idx, chunk in enumerate(chunks):
        doc = Document(
            text=chunk,
            extra_info={
                "user_id": "user_12345",
                "email_id": "email_67890",
                "title": "Product Launch Strategy for Q1 2024",
                "chunk_index": idx,
                "total_chunks": len(chunks),
                "timestamp": datetime.now().isoformat(),
                "source_type": "email"
            }
        )
        documents.append(doc)
    
    print(f"✓ Created {len(documents)} Document objects")
    print(f"  Each document includes:")
    print(f"    - Text content")
    print(f"    - User ID for access control")
    print(f"    - Email ID for source tracking")
    print(f"    - Timestamp for temporal queries")
    print(f"    - Chunk index for ordering")
    
    # STEP 3: Node Generation
    print("\n\nSTEP 3: NODE GENERATION")
    print("-" * 80)
    nodes = splitter.get_nodes_from_documents(documents)
    print(f"✓ Generated {len(nodes)} nodes")
    
    # STEP 4: Embedding Generation
    print("\n\nSTEP 4: EMBEDDING GENERATION")
    print("-" * 80)
    print("Generating embeddings for all nodes...")
    
    node_texts = [node.get_content() for node in nodes]
    embeddings = service.embed_texts(node_texts, batch_size=32, show_progress=True)
    
    print(f"\n✓ Generated {len(embeddings)} embeddings")
    print(f"  Embedding dimension: {len(embeddings[0])}")
    
    # Calculate storage size
    embedding_size = len(embeddings) * len(embeddings[0]) * 4  # 4 bytes per float32
    text_size = sum(len(text.encode('utf-8')) for text in node_texts)
    
    print(f"\n  Storage breakdown:")
    print(f"    Text data: {text_size / 1024:.2f} KB")
    print(f"    Embeddings: {embedding_size / 1024:.2f} KB")
    print(f"    Total: {(text_size + embedding_size) / 1024:.2f} KB")
    
    # STEP 5: Prepare for Vector DB Storage
    print("\n\nSTEP 5: PREPARE DATA FOR VECTOR DATABASE")
    print("-" * 80)
    
    storage_data = []
    for node, embedding in zip(nodes, embeddings):
        storage_data.append({
            "id": node.node_id,
            "embedding": embedding,
            "metadata": {
                "text": node.get_content()[:200] + "...",  # Truncate for display
                "user_id": "user_12345",
                "email_id": "email_67890",
                "chunk_index": len(storage_data)
            }
        })
    
    print(f"✓ Prepared {len(storage_data)} records for insertion")
    print(f"\nSample record structure:")
    sample = storage_data[0]
    print(json.dumps({
        "id": sample["id"],
        "embedding": f"[{len(sample['embedding'])} dimensions]",
        "metadata": sample["metadata"]
    }, indent=2))
    
    print("\n\nREADY FOR VECTOR DATABASE INSERTION")
    print("=" * 80)
    print("\nNext steps in production:")
    print("  1. Connect to vector database (Pinecone, Weaviate, Chroma)")
    print("  2. Create/select index with matching dimensions")
    print("  3. Upsert vectors with metadata")
    print("  4. Configure metadata filters for user_id")
    print("  5. Set up similarity search with cosine metric")
    
    print("\n✓ All steps completed successfully!")
    
    return storage_data


def test_query_workflow():
    """Test the query and retrieval workflow."""
    print("\n" + "="*80)
    print("TEST 5: QUERY WORKFLOW")
    print("="*80 + "\n")
    
    service = get_embedding_service()
    
    # Simulate stored documents
    stored_docs = [
        "We're introducing an advanced analytics dashboard with machine learning algorithms.",
        "The mobile application will have offline capabilities and automatic synchronization.",
        "Enhanced security features include two-factor authentication and encryption.",
        "Development starts next week with beta testing in February.",
        "The backend uses Apache Kafka for streaming and Redis for caching."
    ]
    
    print("SIMULATED STORED DOCUMENTS:")
    print("-" * 80)
    for i, doc in enumerate(stored_docs, 1):
        print(f"{i}. {doc}")
    
    # User query
    query = "What analytics features are being launched?"
    
    print(f"\n\nUSER QUERY: '{query}'")
    print("-" * 80)
    
    # Generate embeddings
    print("\nStep 1: Generate query embedding...")
    query_embedding = service.embed_text(query)
    print(f"✓ Query embedded ({len(query_embedding)} dimensions)")
    
    print("\nStep 2: Generate document embeddings...")
    doc_embeddings = service.embed_texts(stored_docs)
    print(f"✓ {len(doc_embeddings)} document embeddings generated")
    
    print("\nStep 3: Perform similarity search...")
    results = service.find_most_similar(query_embedding, doc_embeddings, top_k=3)
    
    print("\n\nTOP 3 MOST RELEVANT RESULTS:")
    print("=" * 80)
    
    for rank, result in enumerate(results, 1):
        idx = result['index']
        similarity = result['similarity']
        print(f"\nRank {rank} - Similarity: {similarity:.4f}")
        print(f"Document: {stored_docs[idx]}")
    
    print("\n" + "=" * 80)
    print("\n✓ Query workflow completed!")
    print("\nIn production, this would:")
    print("  1. Query vector database with user_id filter")
    print("  2. Retrieve top-k most similar chunks")
    print("  3. Pass chunks to LLM as context")
    print("  4. Generate response with citations")


if __name__ == "__main__":
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "RAG EMBEDDING SYSTEM - DEMONSTRATION" + " "*22 + "║")
    print("╚" + "="*78 + "╝")
    
    try:
        # Run all tests
        test_embedding_generation()
        input("\n\nPress Enter to continue to Test 2...")
        
        test_batch_embeddings()
        input("\n\nPress Enter to continue to Test 3...")
        
        test_similarity_search()
        input("\n\nPress Enter to continue to Test 4...")
        
        test_full_rag_workflow()
        input("\n\nPress Enter to continue to Test 5...")
        
        test_query_workflow()
        
        print("\n\n" + "="*80)
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*80)
        print("\nYour RAG system now has:")
        print("  ✓ Text chunking with semantic splitting")
        print("  ✓ Document creation with metadata")
        print("  ✓ Node generation for indexing")
        print("  ✓ Embedding generation (384-dimensional vectors)")
        print("  ✓ Similarity search functionality")
        print("  ✓ Complete storage and retrieval workflow")
        print("\nNext steps:")
        print("  • Connect to a vector database (Pinecone, Weaviate, Chroma)")
        print("  • Implement vector storage in /rag/store endpoint")
        print("  • Implement vector search in /rag/retrieve endpoint")
        print("  • Add LLM integration for response generation")
        print("="*80 + "\n")
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\n\nError during tests: {e}")
        import traceback
        traceback.print_exc()
