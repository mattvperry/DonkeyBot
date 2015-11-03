#!/bin/sh

. ./env.cfg

docker run \
    -e HUBOT_GROUPME_BOT_ID=${HUBOT_GROUPME_BOT_ID} \
    -e HUBOT_GROUPME_TOKEN=${HUBOT_GROUPME_TOKEN} \
    -e HUBOT_MUMBLE_URL=${HUBOT_MUMBLE_URL} \
    -e HUBOT_MUMBLE_PASSWORD=${HUBOT_MUMBLE_PASSWORD} \
    -e HUBOT_WOW_API_KEY=${HUBOT_WOW_API_KEY} \
    -e HUBOT_FORECAST_API_KEY=${HUBOT_FORECAST_API_KEY} \
    -d \
    -p 8080:8080 \
    donkeybot
