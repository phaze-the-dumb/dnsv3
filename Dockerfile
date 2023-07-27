FROM node:lts-hydrogen
WORKDIR /app

COPY package.json package.json
RUN npm install

EXPOSE 2052
EXPOSE 80
EXPOSE 443

COPY . .
CMD [ "node", "index.js" ]