module.exports = (robot) ->

        

robot.hear/!jerk/i, (res) ->
    
    $.ajax 'https://www.reddit.com/r/circlejerk/.json?count=25?domain=self.circlejerk',
    type: 'GET'
    dataType: 'json'
    success: (data, textStatus, jqXHR) ->
        json = data
    
    post = json.data.children.random
    res.send "#{post.data.title}", "#{post.data.selftext}"