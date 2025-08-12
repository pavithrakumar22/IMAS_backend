# 1️⃣ Use official Node.js base image
FROM node:20-alpine

# 2️⃣ Set working directory in the container
WORKDIR /app

# 3️⃣ Copy only package.json and package-lock.json first (for caching)
COPY package*.json ./

# 4️⃣ Install dependencies
RUN npm ci --omit=dev

# 5️⃣ Copy the rest of the application
COPY . .

# 6️⃣ Expose the port your app runs on (change if needed)
EXPOSE 3000

# 7️⃣ Start the application
CMD ["npm", "start"]