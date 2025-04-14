
FROM node:23

WORKDIR /app

COPY ./package.json /app

RUN npm install 

COPY . .

EXPOSE 3000

ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# DEV BUILD
# CMD [ "npm", "run", "dev" ]
# PRODUCTION BUILD
RUN npm run build
CMD ["npm", "run", "start"]