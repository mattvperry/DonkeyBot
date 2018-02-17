#!/bin/sh

. ./env.cfg

docker run \
    -e HUBOT_WOW_API_KEY=${HUBOT_WOW_API_KEY} \
    -e HUBOT_FORECAST_API_KEY=${HUBOT_FORECAST_API_KEY} \
    -e HUBOT_GOOGLE_CSE_KEY=${HUBOT_GOOGLE_CSE_KEY} \
    -e HUBOT_GOOGLE_CSE_ID=${HUBOT_GOOGLE_CSE_ID} \
    -d \
    -p 8080:8080 \
    --name donkeybot \
    donkeybot
