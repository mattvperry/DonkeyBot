module.exports = (robot) ->

#perryIsNoob = true
timeDecay = 60000
hypeIncrement = 15
maxHype = 100
total = 0
lastTime = Date.now()
gettingHyped = "༼ʘ̚ل͜ʘ̚༽ Hype level rising: "
overHyped = "ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ TOO MUCH HYPE TO HANDLE! ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ"

resetHype ->
    total = total - ((Date.now() - lastTime)%timeDecay)*hypeIncrement
    lastTime = Date.now()
    if total < 0
        total = 0

robot.hear /hype/i, (res) ->
    
    resetHype
    if hype < maxHype
        hype += hypeIncrement
        res.send "#{gettingHyped} : Hype Level #{total}%"
    else
        res.send"#{overHyped}"
    