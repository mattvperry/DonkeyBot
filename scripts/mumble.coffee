mumble = require('mumble')
fs = require('fs')

module.exports = (robot) ->

  timeMap = {}

  options =
    key: fs.readFileSync './certs/private_key.pem'
    cert: fs.readFileSync './certs/cert.pem'

  mumble.connect process.env.HUBOT_MUMBLE_URL, options, (error, cli) ->
    robot.logger.error error if error

    cli.authenticate 'DonkeyBot', process.env.HUBOT_MUMBLE_PASSWORD

    cli.on 'ready', ->
      cli.user.moveToChannel 'Fappin'

    cli.on 'user-move', (user) ->
      if user.channel.name == 'Games'
        currentTime = Date.now()
        if timeMap[user.name] && (currentTime - timeMap[user.name]) > 300000
            timeMap[user.name] = currentTime
            robot.adapter.send {}, "#{user.name} wants to play games!"

    robot.respond /who (.*)/i, (res) ->
      channel = cli.channelByName res.match[1]
      if channel?
        user_names = (user.name for user in channel.users)
        if user_names.length > 0
          res.send user_names...
        else
          res.send "Nobody is in #{res.match[1]}"
      else
        res.send "No channel with name #{res.match[1]}"
