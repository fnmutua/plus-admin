#!/usr/bin/env python3
"""
Offline Document AI Processing Script
Processes documents with AI embeddings in parallel for better performance
Updated to match the new database schema with UUID primary keys and vector(384) storage
"""

import os
import json

import psycopg2
import argparse
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from datetime import datetime

import requests
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('document_processing.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DocumentAIProcessor:
    def __init__(self, source_db_config: Dict[str, str], ai_db_config: Dict[str, str], uploads_dir: str, max_workers: int = 4, batch_size: int = 10, batch_delay: float = 0.1):
        self.source_db_config = source_db_config
        self.ai_db_config = ai_db_config
        self.uploads_dir = Path(uploads_dir)
        self.max_workers = max_workers
        self.batch_size = batch_size
        self.batch_delay = batch_delay
        self.source_conn = None
        self.ai_conn = None
        self.pgvector_available = False
        self.default_embedding_model = "all-minilm"
        
    def connect_source_db(self):
        """Connect to source PostgreSQL database (contains document table)"""
        try:
            self.source_conn = psycopg2.connect(**self.source_db_config)
            logger.info("Connected to source database successfully")
        except Exception as e:
            logger.error(f"Failed to connect to source database: {e}")
            raise
    
    def connect_ai_db(self):
        """Connect to AI PostgreSQL database (contains documents, document_chunks, embeddings tables)"""
        try:
            self.ai_conn = psycopg2.connect(**self.ai_db_config)
            
            # Check if pgvector extension is available
            cursor = self.ai_conn.cursor()
            try:
                cursor.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
                self.pgvector_available = cursor.fetchone() is not None
                if self.pgvector_available:
                    logger.info("pgvector extension detected - vector similarity search enabled")
                else:
                    logger.info("pgvector extension not available - using keyword-based search")
            except Exception as e:
                logger.warning(f"Could not check pgvector extension: {e}")
                self.pgvector_available = False
            finally:
                cursor.close()
            
            logger.info("Connected to AI database successfully")
        except Exception as e:
            logger.error(f"Failed to connect to AI database: {e}")
            raise
    
    def close_source_db(self):
        """Close source database connection"""
        if self.source_conn:
            self.source_conn.close()
            logger.info("Source database connection closed")
    
    def close_ai_db(self):
        """Close AI database connection"""
        if self.ai_conn:
            self.ai_conn.close()
            logger.info("AI database connection closed")
    
    def get_documents_to_process(self, force_reprocess: bool = False) -> List[Dict]:
        """Get all documents from source database that need processing"""
        cursor = self.source_conn.cursor()
        
        # Get all documents from the source database (document table)
        query = """
            SELECT id, name, location, size, format, "aiProcessed", "aiProcessedAt"
            FROM document
            ORDER BY "createdAt" DESC
        """
        cursor.execute(query)
        
        columns = [desc[0] for desc in cursor.description]
        documents = []
        
        for row in cursor.fetchall():
            doc = dict(zip(columns, row))
            if not force_reprocess and doc.get('aiProcessed'):
                logger.info(f"Document {doc['name']} already processed, skipping")
                continue
            documents.append(doc)
        
        cursor.close()
        logger.info(f"Found {len(documents)} documents to process")
        return documents
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks with metadata"""
        if len(text) <= chunk_size:
            return [{
                'content': text,
                'chunk_index': 0,
                'start_position': 0,
                'end_position': len(text),
                'metadata': {}
            }]
        
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence endings
                for i in range(end, max(start + chunk_size - 100, start), -1):
                    if text[i] in '.!?':
                        end = i + 1
                        break
            
            chunk_content = text[start:end].strip()
            if chunk_content:
                chunks.append({
                    'content': chunk_content,
                    'chunk_index': chunk_index,
                    'start_position': start,
                    'end_position': end,
                    'metadata': {
                        'length': len(chunk_content),
                        'word_count': len(chunk_content.split())
                    }
                })
                chunk_index += 1
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks
    
    def extract_text_from_file(self, file_path: Path) -> str:
        """Extract text from various file types"""
        try:
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            file_extension = file_path.suffix.lower()
            
            if file_extension in ['.txt', '.md']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            elif file_extension in ['.pdf']:
                # You'll need to install PyPDF2 or pdfplumber
                try:
                    import PyPDF2
                    text = ""
                    with open(file_path, 'rb') as f:
                        pdf_reader = PyPDF2.PdfReader(f)
                        for page in pdf_reader.pages:
                            text += page.extract_text() + "\n"
                    return text
                except ImportError:
                    logger.warning("PyPDF2 not installed, skipping PDF processing")
                    return ""
            
            elif file_extension in ['.docx']:
                # You'll need to install python-docx
                try:
                    from docx import Document
                    doc = Document(file_path)
                    return "\n".join([paragraph.text for paragraph in doc.paragraphs])
                except ImportError:
                    logger.warning("python-docx not installed, skipping DOCX processing")
                    return ""
            
            else:
                logger.warning(f"Unsupported file type: {file_extension}")
                return ""
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return ""
    
    def generate_embedding(self, text: str, model_name: str = "all-minilm") -> List[float]:
        """Generate embedding for text using Ollama API"""
        try:
            # Ollama API endpoint (default local installation)
            ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
            
            # Prepare the request payload
            payload = {
                "model": model_name,
                "prompt": text
            }
            
            # Make request to Ollama
            response = requests.post(
                f"{ollama_url}/api/embeddings",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('embedding', [])
            else:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                return []
            
        except ImportError:
            logger.error("requests library not installed. Install with: pip install requests")
            return []
        except requests.exceptions.ConnectionError:
            logger.error(f"Could not connect to Ollama at {ollama_url}. Make sure Ollama is running.")
            return []
        except Exception as e:
            logger.error(f"Error generating embedding with Ollama: {e}")
            return []
    
    def generate_embeddings_batch(self, texts: List[str], model_name: str = "all-minilm") -> List[List[float]]:
        """Generate embeddings for multiple texts in a single batch request"""
        try:
            import requests
            import json
            
            # Ollama API endpoint (default local installation)
            ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
            
            # Prepare the batch request payload
            payload = {
                "model": model_name,
                "prompts": texts
            }
            
            # Make batch request to Ollama with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = requests.post(
                        f"{ollama_url}/api/embeddings",
                        json=payload,
                        headers={"Content-Type": "application/json"},
                        timeout=120  # Longer timeout for batch requests
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        # Handle both single and batch responses
                        if 'embeddings' in result:
                            return result['embeddings']
                        elif 'embedding' in result:
                            return [result['embedding']]
                        else:
                            logger.error(f"Unexpected Ollama response format: {result}")
                            return [[] for _ in texts]
                    else:
                        logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                        if attempt < max_retries - 1:
                            time.sleep(1)  # Wait before retry
                            continue
                        return [[] for _ in texts]
                        
                except requests.exceptions.Timeout:
                    logger.warning(f"Timeout on attempt {attempt + 1}, retrying...")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    return [[] for _ in texts]
                    
            return [[] for _ in texts]
            
        except ImportError:
            logger.error("requests library not installed. Install with: pip install requests")
            return [[] for _ in texts]
        except requests.exceptions.ConnectionError:
            logger.error(f"Could not connect to Ollama at {ollama_url}. Make sure Ollama is running.")
            return [[] for _ in texts]
        except Exception as e:
            logger.error(f"Error generating batch embeddings with Ollama: {e}")
            return [[] for _ in texts]
    
    def save_document_to_ai(self, filename: str, file_path: Path, file_size: int, content: str, file_type: str = None) -> Optional[str]:
        """Save document metadata to AI database"""
        cursor = self.ai_conn.cursor()
        try:
            # Generate UUID for document
            document_id = str(uuid.uuid4())
            
            # Determine file type if not provided
            if not file_type:
                file_type = file_path.suffix.lower() if file_path.suffix else 'unknown'
            
            # Create metadata
            metadata = {
                'original_filename': filename,
                'file_extension': file_type,
                'content_length': len(content),
                'word_count': len(content.split()),
                'processed_at': datetime.now().isoformat()
            }
            
            query = """
                INSERT INTO documents (id, filename, file_path, file_type, file_size, content, metadata, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cursor.execute(query, (
                document_id, 
                filename, 
                str(file_path), 
                file_type, 
                file_size, 
                content, 
                json.dumps(metadata), 
                datetime.now(), 
                datetime.now()
            ))
            result = cursor.fetchone()
            self.ai_conn.commit()
            return result[0] if result else document_id
        except Exception as e:
            self.ai_conn.rollback()
            logger.error(f"Error saving document to AI database: {e}")
            return None
        finally:
            cursor.close()
    
    def save_document_chunks(self, document_id: str, chunks: List[Dict[str, Any]]) -> List[str]:
        """Save document chunks to database"""
        cursor = self.ai_conn.cursor()
        chunk_ids = []
        
        try:
            for chunk_data in chunks:
                # Generate UUID for chunk
                chunk_id = str(uuid.uuid4())
                
                query = """
                    INSERT INTO document_chunks (id, document_id, content, chunk_index, start_position, end_position, metadata, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """
                cursor.execute(query, (
                    chunk_id,
                    document_id, 
                    chunk_data['content'], 
                    chunk_data['chunk_index'],
                    chunk_data['start_position'],
                    chunk_data['end_position'],
                    json.dumps(chunk_data['metadata']),
                    datetime.now()
                ))
                result = cursor.fetchone()
                chunk_ids.append(result[0] if result else chunk_id)
            
            self.ai_conn.commit()
            return chunk_ids
            
        except Exception as e:
            self.ai_conn.rollback()
            logger.error(f"Error saving document chunks: {e}")
            return []
        finally:
            cursor.close()
    
    def save_embeddings(self, chunk_ids: List[str], embeddings: List[List[float]], model_name: str = "all-minilm") -> bool:
        """Save embeddings to database with vector(384) storage"""
        cursor = self.ai_conn.cursor()
        
        try:
            for chunk_id, embedding in zip(chunk_ids, embeddings):
                if embedding:  # Only save if embedding was generated
                    # Generate UUID for embedding
                    embedding_id = str(uuid.uuid4())
                    
                    # Convert embedding to pgvector format string
                    embedding_string = f"[{','.join(map(str, embedding))}]"
                    
                    # Use vector(384) type with proper casting
                    query = """
                        INSERT INTO embeddings (id, chunk_id, embedding_vector, model_name, created_at, updated_at)
                        VALUES (%s, %s, %s::vector, %s, %s, %s)
                    """
                    cursor.execute(query, (
                        embedding_id, 
                        chunk_id, 
                        embedding_string, 
                        model_name, 
                        datetime.now(),
                        datetime.now()
                    ))
            
            self.ai_conn.commit()
            logger.info(f"Saved {len([e for e in embeddings if e])} embeddings using {model_name}")
            return True
            
        except Exception as e:
            self.ai_conn.rollback()
            logger.error(f"Error saving embeddings: {e}")
            return False
        finally:
            cursor.close()
    
    def update_document_status(self, document_id: int, ai_processed: bool = True, chunks_count: int = 0, warning: str = None):
        """Update document processing status in source database"""
        cursor = self.source_conn.cursor()
        try:
            query = """
                UPDATE document 
                SET "aiProcessed" = %s, "aiProcessedAt" = %s, "aiChunks" = %s, "aiWarning" = %s
                WHERE id = %s
            """
            cursor.execute(query, (ai_processed, datetime.now(), chunks_count, warning, document_id))
            self.source_conn.commit()
        except Exception as e:
            self.source_conn.rollback()
            logger.error(f"Error updating document status: {e}")
        finally:
            cursor.close()
    
    def process_single_document(self, document: Dict) -> Dict[str, Any]:
        """Process a single document with AI"""
        try:
            doc_id = document['id']
            filename = document['name']
            
            # Determine file path
            if document.get('location') and os.path.isabs(document['location']):
                file_path = Path(document['location'])
            else:
                file_path = self.uploads_dir / filename
            
            logger.info(f"Processing document: {filename} (ID: {doc_id})")
            
            # Extract text
            content = self.extract_text_from_file(file_path)
            if not content:
                warning = "No text content extracted"
                self.update_document_status(doc_id, False, 0, warning)
                return {'success': False, 'reason': warning}
            
            # Save document to AI database
            ai_document_id = self.save_document_to_ai(
                filename, 
                file_path, 
                document.get('size', 0), 
                content, 
                document.get('format')
            )
            if not ai_document_id:
                return {'success': False, 'reason': 'Failed to save document to AI database'}
            
            # Chunk the text
            chunks = self.chunk_text(content)
            if not chunks:
                warning = "No chunks created from content"
                self.update_document_status(doc_id, False, 0, warning)
                return {'success': False, 'reason': warning}
            
            # Save chunks
            chunk_ids = self.save_document_chunks(ai_document_id, chunks)
            if not chunk_ids:
                return {'success': False, 'reason': 'Failed to save document chunks'}
            
            # Generate embeddings in batches for better performance
            embeddings = []
            model_name = self.default_embedding_model
            batch_size = self.batch_size
            
            # Extract chunk contents for batch processing
            chunk_contents = [chunk['content'] for chunk in chunks]
            
            # Process in batches
            for i in range(0, len(chunk_contents), batch_size):
                batch_texts = chunk_contents[i:i + batch_size]
                logger.info(f"Generating embeddings for batch {i//batch_size + 1}/{(len(chunk_contents) + batch_size - 1)//batch_size}")
                
                batch_embeddings = self.generate_embeddings_batch(batch_texts, model_name)
                embeddings.extend(batch_embeddings)
                
                # Small delay between batches to prevent overwhelming Ollama
                if i + batch_size < len(chunk_contents):
                    time.sleep(self.batch_delay)
            
            # Save embeddings
            if not self.save_embeddings(chunk_ids, embeddings, model_name):
                return {'success': False, 'reason': 'Failed to save embeddings'}
            
            # Update document status
            successful_embeddings = sum(1 for emb in embeddings if emb)
            warning = None if successful_embeddings == len(chunks) else f"Only {successful_embeddings}/{len(chunks)} embeddings generated"
            
            self.update_document_status(doc_id, True, len(chunks), warning)
            
            logger.info(f"Successfully processed {filename}: {len(chunks)} chunks, {successful_embeddings} embeddings")
            
            return {
                'success': True,
                'chunks': len(chunks),
                'embeddings': successful_embeddings,
                'document_id': ai_document_id,
                'warning': warning,
                'vector_search': self.pgvector_available
            }
            
        except Exception as e:
            logger.error(f"FAILED {document['name']}: Unexpected error - {e}")
            self.update_document_status(doc_id, False, 0, str(e))
            return {'success': False, 'reason': str(e)}
    
    def process_documents(self, force_reprocess: bool = False):
        """Process all documents from source database in parallel"""
        try:
            self.connect_source_db()
            self.connect_ai_db()
            
            # Log Ollama configuration
            ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
            logger.info(f"Using Ollama embedding model: {self.default_embedding_model}")
            logger.info(f"Ollama API URL: {ollama_url}")
            logger.info(f"Batch size: {self.batch_size} chunks per request")
            logger.info("Performance tips:")
            logger.info("  - Use smaller batch sizes (5-10) for better memory usage")
            logger.info("  - Ensure Ollama has enough RAM allocated")
            logger.info("  - Consider using faster models like 'all-minilm' for speed")
            logger.info("  - Close other applications to free up system resources")
            
            # Get documents to process
            documents = self.get_documents_to_process(force_reprocess)
            
            if not documents:
                logger.info("No documents to process")
                return
            
            logger.info(f"Starting parallel processing of {len(documents)} documents with {self.max_workers} workers")
            
            # Process documents in parallel
            results = []
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                future_to_doc = {executor.submit(self.process_single_document, doc): doc for doc in documents}
                
                for future in as_completed(future_to_doc):
                    doc = future_to_doc[future]
                    try:
                        result = future.result()
                        results.append({
                            'document': doc['name'],
                            'result': result
                        })
                        
                        if result['success']:
                            vector_status = "[VECTOR]" if result.get('vector_search') else "[KEYWORD]"
                            logger.info(f"SUCCESS {doc['name']}: {result['chunks']} chunks processed {vector_status}")
                        else:
                            logger.error(f"FAILED {doc['name']}: {result['reason']}")
                            
                    except Exception as e:
                        logger.error(f"FAILED {doc['name']}: Unexpected error - {e}")
                        results.append({
                            'document': doc['name'],
                            'result': {'success': False, 'reason': str(e)}
                        })
            
            # Summary
            successful = sum(1 for r in results if r['result']['success'])
            failed = len(results) - successful
            
            logger.info(f"\nProcessing Summary:")
            logger.info(f"   Total documents: {len(documents)}")
            logger.info(f"   Successful: {successful}")
            logger.info(f"   Failed: {failed}")
            
            if self.pgvector_available:
                logger.info("Vector similarity search enabled")
            else:
                logger.info("Keyword-based search enabled (pgvector not available)")
            
            # Save results to file
            with open(f'processing_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json', 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
        finally:
            self.close_source_db()
            self.close_ai_db()

def main():
    parser = argparse.ArgumentParser(description='Process documents with AI embeddings using Ollama')
    parser.add_argument('--uploads-dir', default='./data/uploads', help='Directory containing uploaded files')
    parser.add_argument('--force-reprocess', action='store_true', help='Reprocess already processed documents')
    parser.add_argument('--max-workers', type=int, default=4, help='Maximum number of parallel workers')
    parser.add_argument('--embedding-model', default='all-minilm', help='Ollama embedding model to use (default: all-minilm)')
    parser.add_argument('--ollama-url', default='http://localhost:11434', help='Ollama API URL (default: http://localhost:11434)')
    parser.add_argument('--batch-size', type=int, default=20, help='Batch size for embedding generation')
    parser.add_argument('--batch-delay', type=float, default=0.1, help='Batch delay between embedding generations')
    
    args = parser.parse_args()
    
    # Set environment variable for Ollama URL
    os.environ['OLLAMA_URL'] = args.ollama_url
    
    # Source database configuration (contains document table)
    source_db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'kisip',
        'user': 'postgres',
        'password': '***REDACTED***'
    }
    
    # AI database configuration (contains documents, document_chunks, embeddings tables)
    ai_db_config = {
        'host': 'localhost',
        'port': 5445,  # Updated to match the Node.js configuration
        'database': 'document_ai',
        'user': 'postgres',
        'password': '***REDACTED***'
    }
    
    # Create processor and run - always process all documents from source database
    processor = DocumentAIProcessor(source_db_config, ai_db_config, args.uploads_dir, args.max_workers, args.batch_size, args.batch_delay)
    
    # Update the model name in the processor
    processor.default_embedding_model = args.embedding_model
    
    processor.process_documents(force_reprocess=args.force_reprocess)

if __name__ == "__main__":
    main()  