"""
LLM Service for generating responses from retrieved context.

This service uses Groq API to generate well-formatted responses based on
the context retrieved from the vector database.
"""

import logging
import os
from typing import List, Dict, Any, Optional
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class LLMService:
    """
    Service for generating responses using LLM based on retrieved context.
    
    Uses Groq API with fast models like llama3-70b for high-quality responses.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "llama-3.3-70b-versatile"
    ):
        """
        Initialize the LLM service.
        
        Args:
            api_key: Groq API key (from environment if not provided)
            model: Model to use. Options:
                   - llama3-70b-8192 (recommended, high quality)
                   - llama3-8b-8192 (faster, good quality)
                   - mixtral-8x7b-32768 (longer context)
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model
        
        if not self.api_key:
            raise ValueError("Groq API key not found. Set GROQ_API_KEY environment variable.")
        
        print(f"[INFO] Initializing LLM service with model: {self.model}")
        
        try:
            self.client = Groq(api_key=self.api_key)
            print("[INFO] LLM service initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize LLM service: {e}")
            raise
    
    def generate_response(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        temperature: float = 0.3,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        """
        Generate a formatted response based on query and retrieved context.
        
        Args:
            query: The user's question
            context_chunks: List of retrieved chunks with metadata
            temperature: Controls randomness (0.0-1.0, lower is more focused)
            max_tokens: Maximum tokens in response
            
        Returns:
            Dictionary with generated response and metadata
        """
        try:
            print(f"[INFO] Generating response for query: {query}")
            
            # Build context from chunks
            context = self._build_context(context_chunks)
            
            # Build prompt
            prompt = self._build_prompt(query, context)
            
            # Generate response
            print(f"[DEBUG] Sending request to Groq API (model: {self.model})")
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a helpful AI assistant that answers questions based on provided context.
Your responses should be:
- Accurate and based only on the provided context
- Well-formatted with clear structure
- Concise but comprehensive
- Professional and easy to understand
- Include citations when referencing specific information

If the context doesn't contain enough information to answer the question, say so clearly."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=1,
                stream=False
            )
            
            response_text = completion.choices[0].message.content
            
            # Extract usage statistics
            usage = {
                "prompt_tokens": completion.usage.prompt_tokens if completion.usage else 0,
                "completion_tokens": completion.usage.completion_tokens if completion.usage else 0,
                "total_tokens": completion.usage.total_tokens if completion.usage else 0
            }
            
            print(f"[INFO] Response generated successfully. Tokens used: {usage['total_tokens']}")
            
            return {
                "answer": response_text,
                "model": self.model,
                "usage": usage,
                "sources_used": len(context_chunks),
                "finish_reason": completion.choices[0].finish_reason
            }
            
        except Exception as e:
            print(f"[ERROR] Error generating LLM response: {e}")
            raise
    
    def _build_context(self, chunks: List[Dict[str, Any]]) -> str:
        """
        Build context string from retrieved chunks.
        
        Args:
            chunks: List of chunk dictionaries with metadata
            
        Returns:
            Formatted context string
        """
        if not chunks:
            return "No relevant context found."
        
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            title = chunk.get("title", "Untitled")
            text = chunk.get("text", "")
            score = chunk.get("score", 0)
            timestamp = chunk.get("timestamp", "")
            
            # Format each chunk with metadata
            chunk_text = f"""[Source {i} - Relevance: {score:.2%}]
Title: {title}
Timestamp: {timestamp}
Content: {text}
"""
            context_parts.append(chunk_text)
        
        return "\n\n".join(context_parts)
    
    def _build_prompt(self, query: str, context: str) -> str:
        """
        Build the prompt for the LLM.
        
        Args:
            query: User's question
            context: Formatted context from retrieved chunks
            
        Returns:
            Complete prompt string
        """
        prompt = f"""Based on the following context, please answer the user's question.

CONTEXT:
{context}

USER QUESTION:
{query}

Please provide a well-formatted, comprehensive answer. If you reference specific information from the context, indicate which source it came from. If the context doesn't contain enough information to fully answer the question, acknowledge this clearly.

ANSWER:"""
        
        return prompt
    
    def generate_simple_response(
        self,
        query: str,
        context_text: str,
        temperature: float = 0.3,
        max_tokens: int = 512
    ) -> str:
        """
        Generate a simple response without metadata.
        
        Args:
            query: User's question
            context_text: Raw context text
            temperature: Controls randomness
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated response text
        """
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant. Answer questions based on the provided context."
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context_text}\n\nQuestion: {query}\n\nAnswer:"
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            response_content = completion.choices[0].message.content
            return response_content if response_content is not None else ""
            
        except Exception as e:
            print(f"[ERROR] Error generating simple response: {e}")
            raise


# Global instance (singleton pattern)
_llm_service_instance = None


def get_llm_service(model: str = "llama-3.3-70b-versatile") -> LLMService:
    """
    Get or create the global LLM service instance.
    
    Args:
        model: Model to use for generation
        
    Returns:
        LLMService instance
    """
    global _llm_service_instance
    
    if _llm_service_instance is None:
        print("[INFO] Creating new LLMService instance")
        _llm_service_instance = LLMService(model=model)
    
    return _llm_service_instance
