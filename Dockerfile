FROM node:lts-hydrogen
WORKDIR /app

COPY package.json package.json
RUN npm install

COPY . .
CMD [ "node", "index.js" ]