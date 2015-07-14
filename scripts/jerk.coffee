module.exports = (robot) ->
    $.ajax 'https://www.reddit.com/r/circlejerk/.json?count=25?domain=self.circlejerk',
    type: 'GET'
    dataType: 'json'
    success: (data, textStatus, jqXHR) ->
        json = data
        

robot.hear/!jerk/i, (res) ->
    post = json.data.children.random
    res.send "#{post.data.title}", "#{post.data.selftext}"