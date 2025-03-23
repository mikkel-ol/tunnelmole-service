FROM node:20

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

ENV NODE_ENV=productino
ENTRYPOINT ["node", "dist/srv/index.js"]
