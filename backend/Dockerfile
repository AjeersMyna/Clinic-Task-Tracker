# Use the official Node.js 20 LTS image as the base image.
# Alpine is a lightweight Linux distribution, good for smaller image sizes.
FROM node:20-alpine

# Set the working directory inside the container.
# All subsequent commands will be executed in this directory.
WORKDIR /app

# Copy package.json and package-lock.json (if you have one) to the working directory.
# We copy these first to leverage Docker's caching. If dependencies don't change,
# this layer won't be rebuilt.
COPY package*.json ./

# Install dependencies.
# Use 'npm ci' for clean installs in CI/CD environments and Docker builds,
# as it uses package-lock.json for exact versions.
RUN npm ci

# Copy the rest of the application code to the working directory.
COPY . .

# Expose the port your Express.js application listens on.
# Make sure this matches the port configured in your backend (e.g., process.env.PORT or 5000).
EXPOSE 5000

# Define the command to run your application when the container starts.
# 'npm start' should be defined in your package.json scripts.
CMD ["npm", "start"]