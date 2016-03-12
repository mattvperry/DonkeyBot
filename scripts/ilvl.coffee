Promise = require('bluebird')

module.exports = (robot) ->
  key     = process.env.HUBOT_WOW_API_KEY
  baseURL = "https://us.api.battle.net/wow/"
  locale = "en_us"
  users = [
    { name: "Xiara", realm: "Azuremyst" },
    { name: "Titanuus", realm: "Thrall" },
    { name: "Trudgling", realm: "Azuremyst" },
    { name: "Zarpidon", realm: "Azuremyst" },
    { name: "Vashen", realm: "Azuremyst" },
    { name: "Amordos", realm: "Azuremyst" },
  ]
  
  robot.respond /(ilvl)( me)?/i, (msg) ->
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
      
 
  # Call GetIlvl with guild roster
  getRoster = (msg) -> Promise.all((getIlvl msg, char for char in users))
        
  # HTTP GET item level of a character
  getIlvl = (msg, user) ->
    return new Promise (resolve, reject) ->
      msg
        .http("#{baseURL}character/#{user.realm}/#{user.name}")
        .query
          fields: "items"
          locale: locale
          apikey: key
        .get() (err, res, body) ->
          if err
            reject err
          else
            resp = JSON.parse body
            resolve
              name: user.name
              ilvl: resp.items.averageItemLevel
