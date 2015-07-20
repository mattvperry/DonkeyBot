module.exports = (robot) ->
  robot.respond /(jerk)( me)?/i, (msg) ->
    console.log(msg)
    msg
      .http("https://www.reddit.com/r/circlejerk.json")
      .query
        count: 25
        domain: "self.circlejerk"
      .get() (err, res, body) ->
        results = JSON.parse(body)
        post = msg.random results.data.children
        msg.send post.data.title, post.data.selftext
