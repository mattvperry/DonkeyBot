#!/bin/sh

. ./env.cfg

docker run \
    -e HUBOT_GROUPME_BOT_ID=${HUBOT_GROUPME_BOT_ID} \
    -e HUBOT_GROUPME_TOKEN=${HUBOT_GROUPME_TOKEN} \
    -e HUBOT_MUMBLE_URL=${HUBOT_MUMBLE_URL} \
    -e HUBOT_MUMBLE_PASSWORD=${HUBOT_MUMBLE_PASSWORD} \
    -d \
    -p 8080:8080 \
    donkeybot
