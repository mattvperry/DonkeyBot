FROM node:10

ADD package.json yarn.lock /bot/

RUN cd /bot && yarn

ADD . /bot/

WORKDIR /bot

EXPOSE 8080

ENTRYPOINT ["node", "./bin/donkeybot.js", "--name", "donkeybot", "-a", "discord", "-l", "db"]
