# Use an official lightweight Python image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /legal-ai-advisor/backend

# Copy the requirements file and install dependencies and cache freindly import
COPY requirements.txt /legal-ai-advisor/backend/requirements.txt
RUN pip install -r /legal-ai-advisor/backend/requirements.txt

# Copy the backend code
COPY . /legal-ai-advisor/backend
# COPY ../dataset/vector_database.py /legal-ai-advisor/dataset/vector_database.py
# ADD ../dataset/vector_database.py /legal-ai-advisor/dataset/vector_database.py


# Copy the ChromaDB data from dataset directory
# COPY ../dataset/chroma_db /legal-ai-advisor/dataset/chroma_db

#just mount the chroma_db during runtime
#docker run -v C:\Users\Sameer\MyProjects\legal-ai-advisor\dataset\chroma_db:/legal-ai-advisor/dataset/chroma_db -p 5000:5000 legal-backend


# Expose the port Flask will run on
EXPOSE 5000

# Run the Flask application
CMD ["python", "app.py"]


# docker network create legal-ai-network
# docker run --name backend --network legal-ai-network -v C:\Users\Sameer\MyProjects\legal-ai-advisor\dataset\chroma_db:/legal-ai-advisor/dataset/chroma_db -p 5000:5000 -e ISPROD=true legal-backend
# docker run --name frontend --network legal-ai-network -p 5173:5173 -e ISPROD=true legal-frontend