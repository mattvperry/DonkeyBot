module.exports = (robot) ->
  robot.hear /^!jerk/i, (msg) ->
    msg
      .http("https://www.reddit.com/r/circlejerk.json")
      .query
        count: 25
        domain: "self.circlejerk"
      .get() (err, res, body) ->
        resp = []
        results = JSON.parse(body)
        posts = results.data.children
        if results.error
          results.error.errors.forEach (err) ->
            resp += err.message
        else
          post = msg.random posts
          resp = [post.data.title, post.data.selftext]
        msg.send resp...
