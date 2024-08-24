FROM node:22

ADD package.json package-lock.json /bot/

RUN cd /bot && yarn

ADD . /bot/

WORKDIR /bot

EXPOSE 8080

ENTRYPOINT ["node", "./bin/donkeybot.js", "--name", "donkeybot", "-a", "discord", "-l", "db"]
