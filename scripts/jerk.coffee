module.exports = (robot) ->
    $.ajax 'https://www.reddit.com/r/circlejerk/.json?count=25?domain=self.circlejerk',
    type: 'GET'
    dataType: 'json'
    success: (data, textStatus, jqXHR) ->
        json = data.data.children
        

robot.hear/!jerk/i, (res) ->
    post = res.data.children.random
    res.send "#{post.title}", "#{post.selftext}"