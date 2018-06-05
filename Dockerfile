FROM node

COPY . /app/huajiao

WORKDIR /app/huajiao

RUN npm install

EXPOSE 3000

CMD [ "npm", "start" ]