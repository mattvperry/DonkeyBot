// Description:
//  Beat the sniperino
//  
//
// Commands:
//  sniperino( me)? - start a new game of sniperino 
//  snipe( me)? - roll a snipe roll in an attempt to beat the sniperino
//
// Author:
//  Steve Shipsey

import { Robot } from "tsbot";

interface ISniper {
    name: string;
    gamesPlayed: number;
    gamesWon: number;
    currentSnipe?: number;

    getWinRate(): number;
    getNewSnipe();
}

class Sniper implements ISniper {
    public name: string;
    public gamesPlayed: number;
    public gamesWon: number;
    public currentSnipe: number;
    
    constructor(n: string) {
        this.name = n.slice(0, n.indexOf(" "));
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        //this.currentSnipe = this.getNewSnipe();
    }

    public getWinRate(): number {
        return this.gamesPlayed > 0 ? (this.gamesWon / this.gamesPlayed) * 100 : 0;
    }

    public getNewSnipe() {
        this.currentSnipe = Math.floor(Math.random() * 99) + 1;
    }
}

let game = (robot: Robot) => {

    // Get a sniper with a given name. If one doesn't exist, create it.
    let getSniper = (name: string) => {
    
        // Check for active sniper, if not, create one
        if (robot.brain.get(name) == null) {
            robot.brain.set(name, new Sniper(name));
        }
        return robot.brain.get(name);
    }

    robot.respond(/sniperino( me)?/i, (res) => {

        // Define instance of our Sniper object from getSniper method
        let name = res.message.user.name;
        let sniper = getSniper(name);

        // Deny the play if someone is already actively sniping. Otheriwise, display their roll.
        if (sniper.currentSnipe == undefined) {
            
            // Player isn't playing, start a game for them
            sniper.getNewSnipe();
        
            // Send their game information
            res.send("ヽ༼ຈل͜ຈ༽_•︻̷̿┻̿═━一 ༼ つ ಥ_ಥ ༽つ" + sniper.name + ", roll higher than a " + sniper.currentSnipe + " or the donger gets it!");    
            
            // Save this active game back to the brain
            robot.brain.set(name, sniper);
        }
        else {
            // Player is already playing, yell at them because they are an idiot
            res.send("(ノಠ益ಠ)ノ彡┻━┻ YOU ARE ALREADY PLAYING SNIPERINO. I oughtta sniperino YOU! ༼ຈل͜ຈ༽_•︻̷̿┻̿═━一");
        }
    });

    robot.on("sniperino:roll", (res, roll) => {
        
        // Get our currently rolling sniper
        let sniper = getSniper(res.message.user.name);
        
        if (roll > sniper.currentSnipe) {
            res.send("(◠‿◠✿) " + sniper.name + ", you roll a " + roll + " and the donger lives! The donger thanks you (◠‿◠✿)");
        }
        else if (roll == sniper.currentSnipe) {
            res.send("ヽ༼ຈل͜ຈ༽/ " + sniper.name + ", you tie! The donger is merely wounded. He will recover! ヽ༼ຈل͜ຈ༽/");
        }
        else {
            res.send("༼ つ x_x ༽つThe donger is dead. " + sniper.name + ", you did this! You MONSTER! ༼ つ x_x ༽ つ");
        }

    });
};

export = game;

