module.exports = (robot) ->
  robot.respond /(jerk)( me)?/i, (msg) ->
    msg
      .http("https://www.reddit.com/r/circlejerk.json")
      .query
        count: 25
      .get() (err, res, body) ->
        results = JSON.parse(body)
        post = msg.random results.data.children
        msg.send post.data.title
        if post.data.domain is "self.circlejerk"
          if post.data.selftext isnt ""
            msg.send post.data.selftext
        else
          if post.data.url isnt ""
            msg.send post.data.url