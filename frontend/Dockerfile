FROM node:22.19-alpine
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "dev"]
