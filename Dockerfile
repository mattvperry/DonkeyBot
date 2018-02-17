FROM node:9

RUN apt-get update && apt-get install -y \
    ffmpeg git python

ADD package.json yarn.lock /bot/

RUN cd /bot && yarn

ADD . /bot/

WORKDIR /bot

EXPOSE 8080

ENTRYPOINT ["./bin/tsbot", "-a", "discord", "-l", "db"]
