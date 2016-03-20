FROM ubuntu:wily

RUN apt-get update && apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_5.x | bash -

RUN apt-get update && apt-get install -y \
    build-essential nodejs ffmpeg git python

ADD package.json /bot/package.json

RUN cd /bot && npm install --production

ADD certs /bot/certs
ADD bin /bot/bin
ADD scripts /bot/scripts
ADD external-scripts.json /bot/external-scripts.json
ADD hubot-scripts.json /bot/hubot-scripts.json

WORKDIR /bot

EXPOSE 8080

ENTRYPOINT ["./bin/hubot", "-a", "groupme-webhook", "-l", "db"]
