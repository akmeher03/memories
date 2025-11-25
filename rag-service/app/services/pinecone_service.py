"""
Pinecone Vector Database Service

This service handles all interactions with Pinecone vector database:
- Index creation and management
- Vector upsert (insert/update)
- Similarity search with metadata filtering
- Batch operations for efficiency
"""

import logging
import os
from typing import List, Dict, Any, Optional, TypedDict, Sequence
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


# Define Pinecone vector format
class PineconeVector(TypedDict, total=False):
    """Type definition for Pinecone vector format."""
    id: str
    values: List[float]
    metadata: Dict[str, Any]


class PineconeService:
    """
    Service for managing vector storage and retrieval in Pinecone.
    
    Pinecone is a managed vector database optimized for similarity search.
    It provides:
    - Fast approximate nearest neighbor search
    - Metadata filtering
    - Horizontal scalability
    - Managed infrastructure
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        environment: Optional[str] = None,
        index_name: Optional[str] = None,
        dimension: int = 384
    ):
        """
        Initialize Pinecone service.
        
        Args:
            api_key: Pinecone API key (from environment if not provided)
            environment: Pinecone environment (from environment if not provided)
            index_name: Name of the Pinecone index to use
            dimension: Dimension of the embedding vectors (must match your model)
        """
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        self.environment = environment or os.getenv("PINECONE_ENVIRONMENT", "gcp-starter")
        self.index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "rag-memories")
        self.dimension = dimension
        
        if not self.api_key:
            raise ValueError("Pinecone API key not found. Set PINECONE_API_KEY environment variable.")
        
        print(f"[INFO] Initializing Pinecone client for index: {self.index_name}")
        
        try:
            # Initialize Pinecone client
            self.pc = Pinecone(api_key=self.api_key)
            
            # Create or connect to index
            self._ensure_index_exists()
            
            # Get index connection
            self.index = self.pc.Index(self.index_name)
            
            print(f"[INFO] Successfully connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            print(f"[ERROR] Failed to initialize Pinecone: {e}")
            raise
    
    def _ensure_index_exists(self):
        """
        Create index if it doesn't exist.
        
        Creates a serverless index with:
        - Cosine similarity metric (best for normalized embeddings)
        - Specified dimension
        - Metadata support for filtering
        """
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                print(f"[INFO] Index '{self.index_name}' not found. Creating new index...")
                
                # Create serverless index
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",  # Cosine similarity for semantic search
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"  # Change based on your preference
                    )
                )
                
                print(f"[INFO] Index '{self.index_name}' created successfully")
            else:
                print(f"[INFO] Index '{self.index_name}' already exists")
                
        except Exception as e:
            print(f"[ERROR] Error ensuring index exists: {e}")
            raise
    
    def upsert_vectors(
        self,
        vectors: Sequence[PineconeVector],
        namespace: str = "",
        batch_size: int = 100
    ) -> Dict[str, Any]:
        """
        Insert or update vectors in Pinecone.
        
        Upsert operation will:
        - Insert new vectors if they don't exist
        - Update existing vectors if ID already exists
        - Process in batches for efficiency
        
        Args:
            vectors: List of vector dictionaries with format:
                    {
                        "id": "unique_id",
                        "values": [0.1, 0.2, ...],  # embedding vector
                        "metadata": {"key": "value", ...}
                    }
            namespace: Optional namespace for data isolation (e.g., user_id)
            batch_size: Number of vectors to upsert in each batch
            
        Returns:
            Dictionary with upsert statistics
            
        Example:
            >>> vectors = [
            ...     {
            ...         "id": "doc1_chunk0",
            ...         "values": embedding1,
            ...         "metadata": {"user_id": "user123", "text": "..."}
            ...     },
            ...     {
            ...         "id": "doc1_chunk1",
            ...         "values": embedding2,
            ...         "metadata": {"user_id": "user123", "text": "..."}
            ...     }
            ... ]
            >>> service.upsert_vectors(vectors, namespace="user123")
            {'upserted_count': 2}
        """
        try:
            print(f"[INFO] Upserting {len(vectors)} vectors to Pinecone (namespace: {namespace or 'default'})")
            
            total_upserted = 0
            
            # Process in batches
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                
                # Upsert batch (Pinecone handles this internally)
                self.index.upsert(
                    vectors=batch,
                    namespace=namespace
                )
                
                # Count upserted vectors
                batch_count = len(batch)
                total_upserted += batch_count
                print(f"[DEBUG] Batch {i//batch_size + 1}: Upserted {batch_count} vectors")
            
            print(f"[INFO] Successfully upserted {total_upserted} vectors")
            
            return {
                "upserted_count": total_upserted,
                "namespace": namespace or "default"
            }
            
        except Exception as e:
            print(f"[ERROR] Error upserting vectors: {e}")
            raise
    
    def query_vectors(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
        namespace: str = "",
        include_metadata: bool = True,
        include_values: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Query for similar vectors using similarity search.
        
        Performs approximate nearest neighbor search to find the most similar
        vectors to the query vector.
        
        Args:
            query_vector: The embedding vector to search for
            top_k: Number of results to return
            filter_metadata: Optional metadata filter dictionary
                           e.g., {"user_id": "user123", "source_type": "email"}
            namespace: Namespace to search within
            include_metadata: Whether to include metadata in results
            include_values: Whether to include embedding vectors in results
            
        Returns:
            List of matches with scores and metadata
            
        Example:
            >>> query_emb = embedding_service.embed_text("What is AI?")
            >>> results = service.query_vectors(
            ...     query_vector=query_emb,
            ...     top_k=3,
            ...     filter_metadata={"user_id": "user123"}
            ... )
            >>> for match in results:
            ...     print(f"Score: {match['score']}, Text: {match['metadata']['text']}")
        """
        try:
            print(f"[INFO] Querying Pinecone for top {top_k} results (namespace: {namespace or 'default'})")
            
            # Perform query
            response = self.index.query(
                vector=query_vector,
                top_k=top_k,
                filter=filter_metadata,
                namespace=namespace,
                include_metadata=include_metadata,
                include_values=include_values
            )
            
            # Format results
            results = []
            # Handle response object (structure may vary by Pinecone version)
            matches = getattr(response, 'matches', [])
            for match in matches:
                result = {
                    "id": match.id,
                    "score": match.score,
                }
                
                if include_metadata and match.metadata:
                    result["metadata"] = match.metadata
                
                if include_values and match.values:
                    result["values"] = match.values
                
                results.append(result)
            
            print(f"[INFO] Found {len(results)} matching vectors")
            
            return results
            
        except Exception as e:
            print(f"[ERROR] Error querying vectors: {e}")
            raise
    
    def delete_vectors(
        self,
        ids: Optional[List[str]] = None,
        filter_metadata: Optional[Dict[str, Any]] = None,
        namespace: str = "",
        delete_all: bool = False
    ) -> Dict[str, Any]:
        """
        Delete vectors from the index.
        
        Args:
            ids: List of vector IDs to delete
            filter_metadata: Delete all vectors matching this metadata filter
            namespace: Namespace to delete from
            delete_all: If True, delete all vectors in namespace (use with caution!)
            
        Returns:
            Dictionary with deletion statistics
            
        Example:
            # Delete specific vectors
            >>> service.delete_vectors(ids=["doc1_chunk0", "doc1_chunk1"])
            
            # Delete all vectors for a user
            >>> service.delete_vectors(
            ...     filter_metadata={"user_id": "user123"},
            ...     namespace="user123"
            ... )
        """
        try:
            if delete_all:
                print(f"[WARNING] Deleting ALL vectors in namespace: {namespace or 'default'}")
                self.index.delete(delete_all=True, namespace=namespace)
                return {"status": "deleted_all", "namespace": namespace or "default"}
            
            elif ids:
                print(f"[INFO] Deleting {len(ids)} vectors by ID")
                self.index.delete(ids=ids, namespace=namespace)
                return {"status": "deleted", "count": len(ids), "namespace": namespace or "default"}
            
            elif filter_metadata:
                print(f"[INFO] Deleting vectors matching filter: {filter_metadata}")
                self.index.delete(filter=filter_metadata, namespace=namespace)
                return {"status": "deleted_by_filter", "filter": filter_metadata, "namespace": namespace or "default"}
            
            else:
                raise ValueError("Must provide either ids, filter_metadata, or delete_all=True")
                
        except Exception as e:
            print(f"[ERROR] Error deleting vectors: {e}")
            raise
    
    def get_index_stats(self, namespace: str = "") -> Dict[str, Any]:
        """
        Get statistics about the index.
        
        Args:
            namespace: Optional namespace to get stats for
            
        Returns:
            Dictionary with index statistics including vector count, dimension, etc.
        """
        try:
            stats = self.index.describe_index_stats()
            
            return {
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": stats.namespaces
            }
            
        except Exception as e:
            print(f"[ERROR] Error getting index stats: {e}")
            raise
    
    def store_documents(
        self,
        nodes: List[Any],
        embeddings: List[List[float]],
        user_id: str,
        email_id: str,
        title: str
    ) -> Dict[str, Any]:
        """
        Simplified method to store documents with embeddings in Pinecone.
        
        This method handles all the complexity of:
        - Creating proper vector format
        - Adding security metadata
        - Namespace creation
        - Batch processing
        
        Args:
            nodes: List of document nodes (chunks)
            embeddings: List of embedding vectors (must match nodes length)
            user_id: User ID for security isolation
            email_id: Email/Document ID
            title: Document title
            
        Returns:
            Dictionary with storage statistics
            
        Example:
            >>> result = pinecone_service.store_documents(
            ...     nodes=nodes,
            ...     embeddings=embeddings,
            ...     user_id="user123",
            ...     email_id="email001",
            ...     title="My Document"
            ... )
            >>> print(result['vectors_stored'])
            10
        """
        try:
            print(f"[INFO] Storing {len(nodes)} documents for user {user_id}")
            
            # Create secure namespace for user isolation
            # Use user-level namespace so we can search across all user's documents
            namespace = f"user_{user_id}_{email_id}"
            
            # Prepare vectors with metadata (all complexity hidden here)
            pinecone_vectors = []
            for node, embedding in zip(nodes, embeddings):
                # Extract existing metadata from node
                metadata = node.metadata if hasattr(node, 'metadata') else {}
                
                # Add required fields for retrieval and security
                metadata["text"] = node.get_content()
                metadata["user_id"] = user_id  # Security: filter by user
                metadata["email_id"] = email_id
                metadata["title"] = title
                
                pinecone_vectors.append({
                    "id": node.node_id,
                    "values": embedding,
                    "metadata": metadata
                })
            
            # Store in Pinecone (automatic batching)
            upsert_result = self.upsert_vectors(
                vectors=pinecone_vectors,
                namespace=namespace,
                batch_size=100
            )
            
            print(f"[INFO] Successfully stored {upsert_result['upserted_count']} vectors")
            
            return {
                "vectors_stored": upsert_result['upserted_count'],
                "namespace": namespace,
                "user_id": user_id,
                "email_id": email_id
            }
            
        except Exception as e:
            print(f"[ERROR] Error storing documents: {e}")
            raise
    
    def search_documents(
        self,
        query_vector: List[float],
        user_id: str,
        top_k: int = 5,
        email_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Simplified method to search for documents in Pinecone.
        
        This method handles:
        - Namespace selection (user isolation)
        - Metadata filtering (security)
        - Result formatting
        
        Args:
            query_vector: The embedding vector to search for
            user_id: User ID for security isolation
            top_k: Number of results to return
            email_id: Optional - filter by specific email/document ID
            
        Returns:
            List of matching documents with scores and metadata
            
        Example:
            >>> query_emb = embedding_service.embed_text("What is AI?")
            >>> results = pinecone_service.search_documents(
            ...     query_vector=query_emb,
            ...     user_id="user123",
            ...     top_k=5
            ... )
        """
        try:
            print(f"[INFO] Searching documents for user {user_id}")
            
            # Use user's namespace for isolation
            namespace = f"user_{user_id}"
            
            # Build metadata filter for security
            filter_metadata = {"user_id": user_id}
            if email_id:
                filter_metadata["email_id"] = email_id
            
            # Query Pinecone
            results = self.query_vectors(
                query_vector=query_vector,
                top_k=top_k,
                filter_metadata=filter_metadata,
                namespace=namespace,
                include_metadata=True,
                include_values=False
            )
            
            print(f"[INFO] Found {len(results)} matching documents")
            return results
            
        except Exception as e:
            print(f"[ERROR] Error searching documents: {e}")
            raise


# Global instance (singleton pattern)
_pinecone_service_instance = None


def get_pinecone_service(dimension: int = 384) -> PineconeService:
    """
    Get or create the global Pinecone service instance.
    
    Args:
        dimension: Dimension of embeddings (must match your embedding model)
        
    Returns:
        PineconeService instance
    """
    global _pinecone_service_instance
    
    if _pinecone_service_instance is None:
        print("[INFO] Creating new PineconeService instance")
        _pinecone_service_instance = PineconeService(dimension=dimension)
    
    return _pinecone_service_instance
