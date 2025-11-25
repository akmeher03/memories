"""
Embedding Service for RAG System

This service handles the generation of embeddings for text chunks using
sentence-transformers. Embeddings are dense vector representations that
capture semantic meaning, enabling similarity-based retrieval.
"""

import logging
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for generating embeddings from text using sentence transformers.
    
    The embedding model converts text into dense vectors that capture semantic
    meaning. These vectors can be compared using cosine similarity to find
    semantically similar content.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service with a pre-trained model.
        
        Args:
            model_name: Name of the sentence-transformer model to use.
                       Default is 'all-MiniLM-L6-v2' which provides:
                       - 384-dimensional embeddings
                       - Fast inference speed
                       - Good balance of quality and performance
                       - Model size: ~80MB
        
        Other popular options:
            - 'all-mpnet-base-v2': 768-dim, higher quality, slower (420MB)
            - 'paraphrase-MiniLM-L3-v2': 384-dim, fastest (60MB)
            - 'multi-qa-MiniLM-L6-cos-v1': Optimized for question-answering
        """
        print(f"[INFO] Initializing EmbeddingService with model: {model_name}")
        try:
            self.model = SentenceTransformer(model_name)
            self.model_name = model_name
            self.embedding_dimension = self.model.get_sentence_embedding_dimension()
            print(f"[INFO] Model loaded successfully. Embedding dimension: {self.embedding_dimension}")
        except Exception as e:
            print(f"[ERROR] Failed to load embedding model: {e}")
            raise
    
    def embed_text_while_searching(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string.
        
        Args:
            text: The text to embed
            
        Returns:
            List of floats representing the embedding vector
        
        Example:
            >>> service = EmbeddingService()
            >>> embedding = service.embed_text("Hello world")
            >>> len(embedding)
            384
        """
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            embedding_array = np.array(embedding)
            return embedding_array.tolist()
        except Exception as e:
            print(f"[ERROR] Failed to embed text: {e}")
            raise
    
    def embed_texts_while_storing(self, texts: List[str], batch_size: int = 32, show_progress: bool = False) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches.
        
        Batch processing is more efficient than embedding texts one at a time.
        The model can process multiple texts in parallel on GPU.
        
        Args:
            texts: List of text strings to embed
            batch_size: Number of texts to process in each batch.
                       Larger batches are faster but use more memory.
                       Default: 32 (good balance for most cases)
            show_progress: Whether to show a progress bar during encoding
            
        Returns:
            List of embedding vectors, one for each input text
            
        Example:
            >>> texts = ["First document", "Second document", "Third document"]
            >>> embeddings = service.embed_texts(texts)
            >>> len(embeddings)
            3
            >>> len(embeddings[0])
            384
        """
        try:
            print(f"[INFO] Embedding {len(texts)} texts with batch_size={batch_size}")
            embeddings = self.model.encode(
                texts, 
                batch_size=batch_size,
                convert_to_numpy=True,
                show_progress_bar=show_progress
            )
            print(f"[INFO] Successfully generated {len(embeddings)} embeddings")
            embeddings_array = np.array(embeddings)
            return embeddings_array.tolist()
        except Exception as e:
            print(f"[ERROR] Failed to embed texts: {e}")
            raise
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Cosine similarity measures the angle between two vectors, ranging from -1 to 1:
        - 1.0: Vectors point in the same direction (very similar)
        - 0.0: Vectors are orthogonal (unrelated)
        - -1.0: Vectors point in opposite directions (very dissimilar)
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score between 0 and 1
            
        Example:
            >>> emb1 = service.embed_text("machine learning")
            >>> emb2 = service.embed_text("artificial intelligence")
            >>> similarity = service.compute_similarity(emb1, emb2)
            >>> print(f"Similarity: {similarity:.3f}")
            Similarity: 0.756
        """
        arr1 = np.array(embedding1)
        arr2 = np.array(embedding2)
        
        # Compute cosine similarity
        dot_product = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        return float(similarity)
    
    def find_most_similar(
        self, 
        query_embedding: List[float], 
        candidate_embeddings: List[List[float]], 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find the top-k most similar embeddings to a query embedding.
        
        This is useful for local similarity search without a vector database.
        For production systems with large datasets, use a vector database instead.
        
        Args:
            query_embedding: The query vector to compare against
            candidate_embeddings: List of candidate vectors to search through
            top_k: Number of top results to return
            
        Returns:
            List of dictionaries with 'index' and 'similarity' keys,
            sorted by similarity (highest first)
            
        Example:
            >>> query = "What is machine learning?"
            >>> docs = ["AI and ML overview", "Cooking recipes", "ML algorithms"]
            >>> query_emb = service.embed_text(query)
            >>> doc_embs = service.embed_texts(docs)
            >>> results = service.find_most_similar(query_emb, doc_embs, top_k=2)
            >>> for result in results:
            ...     print(f"Index: {result['index']}, Similarity: {result['similarity']:.3f}")
            Index: 0, Similarity: 0.823
            Index: 2, Similarity: 0.791
        """
        similarities = []
        for idx, candidate in enumerate(candidate_embeddings):
            sim = self.compute_similarity(query_embedding, candidate)
            similarities.append({"index": idx, "similarity": sim})
        
        # Sort by similarity (highest first)
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Return top-k results
        return similarities[:top_k]
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded embedding model.
        
        Returns:
            Dictionary with model metadata
        """
        return {
            "model_name": self.model_name,
            "embedding_dimension": self.embedding_dimension,
            "max_sequence_length": self.model.max_seq_length,
        }


# Global instance (singleton pattern)
_embedding_service_instance = None


def get_embedding_service(model_name: str = "all-MiniLM-L6-v2") -> EmbeddingService:
    """
    Get or create the global embedding service instance.
    
    Using a singleton ensures the model is loaded only once and shared
    across all requests, which is more efficient than loading it repeatedly.
    
    Args:
        model_name: Name of the sentence-transformer model to use
        
    Returns:
        EmbeddingService instance
    """
    global _embedding_service_instance
    
    if _embedding_service_instance is None:
        print("[INFO] Creating new EmbeddingService instance")
        _embedding_service_instance = EmbeddingService(model_name=model_name)
    
    return _embedding_service_instance
