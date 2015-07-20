Q = require('q')

module.exports = (robot) ->
  key     = process.env.HUBOT_WOW_API_KEY
  locale  = "en_us"
  realm   = "Azuremyst"
  guild   = "Such Tilt"
  baseURL = "https://us.api.battle.net/wow/"
  
  robot.respond /(suchtilt)( me)?/i, (msg) ->
    getRoster(msg)
      .then (data) ->
        chars = data
          .sort (a, b) ->
            return -1 if a.ilvl > b.ilvl
            return 1 if a.ilvl < b.ilvl
            return 0
          .map (char) ->
            "#{char.name}: #{char.ilvl}"
        msg.send chars...
      .done()

  # HTTP GET guild roster
  getRoster = (msg) ->
    deferred = Q.defer()
    
    msg
    .http("#{baseURL}guild/#{realm}/#{guild}")
    .query
      fields: "members"
      locale: locale
      apikey: key
    .get() (err, res, body) ->
      if err
        deferred.reject err
      else
        resp = JSON.parse body
        Q.all((getILvl msg, member.character.name for member in resp.members))
          .then (data) ->
            deferred.resolve data

    return deferred.promise
        
  # HTTP GET item level of a character
  getILvl = (msg, name) ->
    deferred = Q.defer()

    msg
      .http("#{baseURL}character/#{realm}/#{name}")
      .query
        fields: "items"
        locale: locale
        apikey: key
      .get() (err, res, body) ->
        if err
          deferred.reject err
        else
          resp = JSON.parse body
          deferred.resolve
            name: name
            ilvl: resp.items.averageItemLevel

    return deferred.promise
