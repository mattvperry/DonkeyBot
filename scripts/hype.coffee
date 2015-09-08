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
        curTime = Date.now()
        total = total - ((curTime - lastTime)%timeDecay)*hypeIncrement
        lastTime = curTime
        total = 0 if total < 0

    robot.hear /hype/i, (res) ->
    
        resetHype
        if hype < maxHype
            hype += hypeIncrement
            res.send "#{gettingHyped} : Hype Level #{total}%"
        else
            res.send"#{overHyped}"
    