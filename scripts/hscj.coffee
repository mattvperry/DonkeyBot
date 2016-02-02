Q = require('q')

module.exports = (robot) ->
  ans_route = "/hubot/hscj"
  last_link = ""

  robot.router.get ans_route, (req, res) =>
    res.redirect last_link
    res.end()

  robot.respond /(hscj)( me)?/i, (msg) ->
    sub = msg.random ["hearthstone", "hearthstonecirclejerk"]
    reddit(msg, sub).then (data) ->
      last_link = data.permalink
      msg.send data.title, data.body, process.env.HUBOT_DOMAIN + ans_route
    
reddit = (msg, sub) ->
  deferred = Q.defer()
  
  msg
    .http("https://www.reddit.com/r/" + sub + ".json")
    .query
      count: 25
    .get() (err, res, body) ->
      if err
        deferred.reject err
      else
        results = JSON.parse body
        data = msg.random(results.data.children).data
        deferred.resolve
          permalink: "https://reddit.com" + data.permalink
          title: data.title
          body: if data.domain.match(/^self\./) then data.selftext else data.url
        
  return deferred.promise