FROM node:latest

ADD . /bot/

WORKDIR /bot

EXPOSE 8080

ENTRYPOINT ["./bin/hubot", "-a", "groupme-webhook", "-l", "db"]
