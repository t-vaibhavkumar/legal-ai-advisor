# Use an official Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /my-react-app

# Copy package.json and package-lock.json first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend code
COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# Run Vite's dev server
CMD ["npm", "run", "dev"]
