
FROM node:23

WORKDIR /app

COPY ./package.json /app

RUN npm install 

COPY . .

EXPOSE 3000

RUN npm run build

# CMD [ "npm", "run", "dev" ]
CMD ["npm", "run", "start"]