var moment = require('moment');
var momentDurationFormat = require("moment-duration-format");
momentDurationFormat(moment);

require('ts-node/register');
require('coffee-script/register');
require('../node_modules/hubot/bin/hubot.js');
