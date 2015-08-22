#Does not work.
###
# coffeelint: disable=max_line_length
module.exports = (robot) ->
  dongerOutcome = ['alive','dead']
  gameOutcome = ['winning against', 'losing to']
  
  # Respond to sniperino with a sniperino challenge, or get sassy if the user is already playing
  robot.respond /sniperino( me)?/i, (res) ->
    # Is user currently playing?
    user = res.message.user.name
    userChallenge = robot.brain.get(user)
    # User isn't currenly playing
    if userChallenge <= 0
      robot.brain.set user, rng()
      res.send "#{user}, roll higher than a #{robot.brain.get(user)} or the donger gets it!"
    else
      res.send "#{user} is already playing Sniperino, you doofus! I oughtta sniperino YOU!"
  
  # Respond to roll with a roll, whether against a sniperino game or for the lolz
  robot.respond /roll( me)?/i, (res) ->
    roll = rng()
    user = res.message.user.name
    challenge = robot.brain.get(user).challenge
    
    # Is user currently playing Sniperino?
    if challenge > 0
      # 0 is a loss, 1 is a win
      if roll > challenge then gameStatus = 1 else gameStatus = 0
      res.send "#{user} rolled a #{roll}, #{gameOutcome[gameStatus]} the challenge of #{challenge}! #{dongerOutcome[gameStatus]}"
      robot.brain.set user, 0
      updateStats(user, gameStatus)
    else
      res.send "#{user} rolled a #{roll}!"
  
  # Send a list of users with their win percentages
  robot.respond /stats( me)?/i, (res) ->
    getStats(res)
      .then (data) ->
        stats = data
          .sort (a, b) ->
            return -1 if a.winPct > b.winPct
            return 1 if a.winPct < b.winPct
            return 0
          .map (stats) ->
            "#{stats.name}: #{stats.winPct}%"
        res.send stats...
      .done()
      
  # Update number of wins and number of games played for user
  updateStats = (user, outcome) ->
    
    # For the first timers
    if !games then robot.brain.set "#{user} games", 1 else robot.brain.set "#{user} games", (ParseInt robot.brain.get "#{user} games") + 1
    if !wins then robot.brain.set "#{user} wins", outcome else robot.brain.set "#{user} wins", (ParseInt robot.brain.get "#{user} wins") + 1
  
  getStats = (res) ->
    gamesArray = robot.brain.get "/(.*)( games)"
    winsArray  = robot.brain.get "/(.*)( wins)"
    res.send userArray
    return userArray
  
  # Generate a random number between 1 and 100 inclusive
  rng = () ->
    return (Math.floor(Math.random() * 100) + 1)