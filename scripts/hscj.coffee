Q = require('q')
googl = require('goo.gl')

googl.setKey(process.env.HUBOT_GOOGLE_CSE_KEY)

module.exports = (robot) ->
  robot.respond /(hscj)( me)?/i, (msg) ->
    sub = msg.random ["hearthstone", "hearthstonecirclejerk"]
    reddit(msg, sub)
      .then (data) ->
        msg.send data.title
        msg.send data.body
        return googl.shorten(data.permalink)
      .then (url) ->
        msg.send "> " + url
    
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
