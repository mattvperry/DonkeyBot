FROM node:latest

ADD package.json /bot/package.json

RUN cd /bot && npm install

ADD . /bot/

WORKDIR /bot

EXPOSE 8080

ENTRYPOINT ["./bin/hubot", "-a", "groupme-webhook", "-l", "db"]
