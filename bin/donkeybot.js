/* eslint-disable @typescript-eslint/no-var-requires */

const moment = require('moment');
const momentDurationFormat = require('moment-duration-format');

momentDurationFormat(moment);

require('ts-node/register');
require('coffee-script/register');
require('../node_modules/hubot/bin/hubot.js');
