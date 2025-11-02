# ./frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Copy privacy policy files to build directory if they exist
RUN if [ -d "./privacy-policy" ]; then cp -r ./privacy-policy ./build/; fi

# Output: build folder is ready here
