from langchain.text_splitter import RecursiveCharacterTextSplitter

with open("legal_texts.txt", "r", encoding="utf-8") as f:
    text = f.read()

splitter = RecursiveCharacterTextSplitter(chunk_size=1024, chunk_overlap=100)
chunks = splitter.split_text(text)

# Save chunks for vector storage
with open("legal_chunks.txt", "w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(chunk + "\n\n")
