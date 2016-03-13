Promise     = require('bluebird')
Queue       = require('promise-queue')
wav         = require('wav')
youtubedl   = require('youtube-dl')
ffmpeg      = require('fluent-ffmpeg')
mumble      = require('mumble')
fs          = require('fs')

class Player
  constructor: (@cli) ->
    @playing = false
    @gain = .1
    @queue = new Queue(1)

  add: (url) -> @queue.add () => this._stream(url)

  pause: ->
    if @cmd and @playing
      @cmd.kill 'SIGSTOP'
      @playing = false

  resume: ->
    if @cmd and !@playing
      @cmd.kill 'SIGCONT'
      @playing = true

  skip: ->
    if @cmd and @playing
      @cmd.kill()
      @playing = false

  clear: ->
    @queue.queue = []
    this.skip()

  volume: (vol) ->
    gain = parseInt(vol) * .01
    if @cmd and @output and gain > 0 and gain <= 1
      @gain = gain
      @output.setGain @gain

  _stream: (url) ->
    @playing = true
    this._getInfoAsync(url, []).then (info) =>
      @output = @cli.inputStream gain: @gain
      @cmd = ffmpeg(info.url)
        .noVideo()
        .format('wav')
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(48000)
      @cmd
        .pipe(new wav.Reader())
        .pipe(@output)
      new Promise (resolve, reject) =>
        @cmd.on 'error', reject
        @cmd.on 'end', resolve

  _getInfoAsync: Promise.promisify youtubedl.getInfo

class MumbleBot
  constructor: (@robot) ->
    @name = 'DonkeyBot'
    @timeMap = {}
    @options =
      key: fs.readFileSync './certs/private_key.pem'
      cert: fs.readFileSync './certs/cert.pem'
  
  connect: (url, pass) ->
    this._connectAsync(url, @options)
      .then (cli) =>
        cli.authenticate @name, pass

        @player = new Player cli
        cli.on 'ready', () => this._ready cli
        cli.on 'user-move', this._userMove.bind(this)
        cli.on 'message', (msg) =>
          this._message(msg.replace(/<[^>]+>/ig, ""))
        this._addResponder cli
      .catch (err) =>
        @robot.logger.error err

  _message: (msg) ->
    commands = [
      { regex: /!p(ause)?/, fn: () => @player.pause() },
      { regex: /!r(esume)?/, fn: () => @player.resume() },
      { regex: /!s(kip)?/, fn: () => @player.skip() },
      { regex: /!a(dd)? ([^\s]+)/, fn: (match) => @player.add(match[2]) },
      { regex: /!c(lear)?/, fn: () => @player.clear() },
      { regex: /!vol(ume)? ([^\s]+)/, fn: (match) => @player.volume(match[2]) }
    ]

    c.fn(msg.match(c.regex)) for c in commands when c.regex.test(msg)
  
  _connectAsync: Promise.promisify mumble.connect

  _ready: (cli) ->
    cli.user.moveToChannel 'Games'

  _userMove: (user) ->
    if user.channel.name == 'Games' and user.name != @name
      currentTime = Date.now()
      if !@timeMap[user.name] || (currentTime - @timeMap[user.name]) > 60000
          @timeMap[user.name] = currentTime
          @robot.adapter.send {}, "#{user.name} wants to play games!"

  _addResponder: (cli) ->
    @robot.respond /who (.*)/i, (res) ->
      channel = @cli.channelByName res.match[1]
      if channel?
        user_names = (user.name for user in channel.users)
        if user_names.length > 0
          res.send user_names...
        else
          res.send "Nobody is in #{res.match[1]}"
      else
        res.send "No channel with name #{res.match[1]}"


module.exports = (robot) ->
  mumbleBot = new MumbleBot(robot)
  mumbleBot.connect process.env.HUBOT_MUMBLE_URL, process.env.HUBOT_MUMBLE_PASSWORD
