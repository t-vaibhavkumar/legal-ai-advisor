# Download the chromaDB knowledge base
1) Download it from the [link](https://drive.google.com/file/d/1ZABuouQFPBZghdsWz3FRF5-pj7yMnZyX/view?usp=sharing)
2) Unzip it and place the chroma_db folder under the dataset folder

# Install all the necessary dependencies

## Backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

## Frontend dependencies
from the root directory in the terminal run
```bash
cd frontend/my-react-app
npm install
```

## Install ollama
The application is currently configured to ask the LLaMa3.2 LLM which is locally hosted

Install ollama for windows => https://ollama.com/download/OllamaSetup.exe

for mac and linux reference the ollama github repository readme =>  https://github.com/ollama/ollama?tab=readme-ov-file

### To install the llama3.2 model
```bash
ollama run llama3.2
```

# Start the application
## Start the backend server
```bash
cd backend
python app.py
```
## Start the frontend server
```bash
cd frontend/my-react-app
npm run dev
```