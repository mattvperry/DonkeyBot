FROM node:22

ADD package.json package-lock.json /bot/

ADD patches /bot/

RUN cd /bot && npm install

ADD . /bot/

WORKDIR /bot

EXPOSE 8080

ENTRYPOINT ["node", "--loader", "ts-node/esm", "./bin/donkeybot.mjs", "--name", "donkeybot", "-a", "discord", "-l", "db"]
