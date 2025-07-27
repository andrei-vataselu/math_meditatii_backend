# Use official Node.js LTS image
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Use environment variables from .env in production
ENV NODE_ENV=production

# Start the app
CMD [ "node", "server.js" ]
