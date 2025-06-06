import os
import torch # type: ignore
from langchain_community.vectorstores import Chroma  # type: ignore # Updated import
from langchain_huggingface import HuggingFaceEmbeddings  # type: ignore # Updated import
from tqdm import tqdm  # type: ignore # Progress bar

# Ensure ChromaDB is always stored in /dataset/chroma_db
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # Get project root
CHROMA_DB_PATH = os.path.join(BASE_DIR, "dataset", "chroma_db")

# Check if GPU is available
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"✅ Using device: {DEVICE}")

# Initialize embeddings with GPU support
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",  
    model_kwargs={"device": DEVICE}  # Enable GPU usage
)

# Create ChromaDB in the correct location
db = Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=embeddings)

# Function to add documents to DB with progress tracking
def store_documents():
    dataset_path = os.path.join(BASE_DIR, "dataset", "legal_chunks.txt")
    
    with open(dataset_path, "r", encoding="utf-8") as f:
        legal_chunks = [line.strip() for line in f.readlines() if line.strip()]
    
    print(f"✅ Found {len(legal_chunks)} legal documents. Storing in ChromaDB...")

    # Use tqdm for progress bar
    batch_size = 500  # Store in chunks of 500 for efficiency
    for i in tqdm(range(0, len(legal_chunks), batch_size), desc="Processing", unit="batch"):
        batch = legal_chunks[i:i + batch_size]
        db.add_texts(batch)
    
    db.persist()
    print(f"✅ Legal database stored successfully at {CHROMA_DB_PATH}")

def search_documents(query, k=3):
    """Retrieve the top k most relevant legal documents for a given query."""
    results = db.similarity_search(query, k=k)
    return [doc.page_content for doc in results]

if __name__ == "__main__":
    store_documents()  # Run this script to store data initially
    