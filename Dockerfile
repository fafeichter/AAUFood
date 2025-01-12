FROM node:23.5.0-alpine

RUN apk update
RUN apk add --no-cache tzdata ghostscript graphicsmagick
ENV TZ="/usr/share/zoneinfo/Europe/Vienna"

RUN mkdir -p /usr/src/aaufood/app
WORKDIR /usr/src/aaufood

COPY package.json /usr/src/aaufood
COPY package-lock.json /usr/src/aaufood
COPY start.sh /usr/src/aaufood
RUN npm install
# Sharp has specific platform dependencies. Because we are working in an environment with a non-standard architecture
# (Alpine Linux with musl libc), we need to adjust the installation.
RUN npm install --os=linux --libc=musl --cpu=x64 sharp

COPY app/. /usr/src/aaufood/app
RUN sh -l -c 'npm run build'

EXPOSE 3000

CMD [ "./start.sh" ]