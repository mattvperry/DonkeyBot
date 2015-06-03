Mumble = require('mumble')

module.exports = (robot) ->
  Mumble.connect process.env.HUBOT_MUMBLE_URL, {}, (error, cli) ->
    cli.authenticate 'DonkeyBot2', process.env.HUBOT_MUMBLE_PASSWORD

    cli.on 'ready', ->
      cli.user.moveToChannel 'Fappin'

    cli.on 'user-move', (user) ->
      if user.channel.name == 'Games'
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
