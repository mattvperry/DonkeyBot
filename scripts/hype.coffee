module.exports = (robot) ->

total = 0;
lastTime = Date.now();
gettingHyped = "༼ʘ̚ل͜ʘ̚༽ Hype level rising: "
overHyped = "ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ TOO MUCH HYPE TO HANDLE! ヽヽ༼༼ຈຈل͜ل͜ຈຈ༽༽ﾉﾉ"

resetHype ->
    total = total - ((Date.now() - lastTime)%60000)*15
    lastTime = Date.now()
    if total < 0
        total = 0

obot.hear /rekt/i, (res) ->
    
    resetHype
    if hype < 100
        hype += 15
        res.send "#{gettingHyped} : Hype Level #{total}%"
    else
        res.send"#{overHyped}"
    