FROM node:16.19.0-alpine

RUN apk add --no-cache tzdata
ENV TZ="/usr/share/zoneinfo/Europe/Vienna"

RUN mkdir -p /usr/src/aaufood/app
RUN mkdir -p /usr/src/aaufood/upload
WORKDIR /usr/src/aaufood

COPY package.json /usr/src/aaufood
COPY package-lock.json /usr/src/aaufood
COPY start.sh /usr/src/aaufood
RUN npm install

COPY app/. /usr/src/aaufood/app
RUN sh -l -c 'npm run build'

EXPOSE 3000

CMD [ "./start.sh" ]
