module.exports = (robot) ->
  @key     = process.env.HUBOT_WOW_API_KEY
  @locale  = "en_us"
  @realm   = "Azuremyst"
  @guild   = "Such Tilt"
  @baseURL = "https://us.api.battle.net/wow/"
  
  robot.respond /(suchtilt)( me)?/i, (msg) ->
    getRoster(msg)

  # HTTP GET guild roster
  getRoster = (msg) ->
    msg
    .http(baseURL + "guild/" + realm + "/" + guild)
    .query
      fields: "members"
      locale: locale
      apikey: key
    .get() (err, res, body) ->
      resp = ""
      members = JSON.parse(body).members
      if members.error
        members.error.errors.forEach (err) ->
        resp += err.message
        return resp
      else
        getILvl(msg, member) for member in members
        
  # HTTP GET item level of a character
  getILvl = (msg, member) ->
    msg
      .http(baseURL + "character/" + realm + "/" + member.character.name)
      .query
        fields: "items"
        locale: locale
        apikey: key
      .get() (err, res, body) ->
        resp = ""
        ilvl = JSON.parse(body).items.averageItemLevel
        charData = member.character.name + ": " + ilvl + "\r\n"
        if ilvl.error
          ilvl.error.errors.forEach (err) ->
          resp += err.message
          return resp
        else
          msg.send charData