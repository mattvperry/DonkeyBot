// Description:
//  Beat the sniperino
//  
//
// Commands:
//  sniperino( me)? - start a new game of sniperino 
//
//
// Author:
//  Steve Shipsey

import { Robot, User } from "tsbot";

interface ISniper {
    name: string;
    gamesPlayed: number;
    gamesWon: number;
    currentSnipe: number;

    getWinRate(): number;
    generateNewSnipe();
}

class Sniper implements ISniper {
    public name: string;
    public gamesPlayed: number;
    public gamesWon: number;
    public currentSnipe: number;
    
    constructor(user: User) {
        this.name = user.name.split(" ").length > 1 ? user.name.split(" ")[1] : user.name;
        
        if (user.name == "Andrew Janucik") {
            this.name = "Guiseppe";
        }

        if (user.name == "Joe Kim") {
            this.name = "Jow";
        }
        
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        this.currentSnipe = null;
    }

    public getWinRate(): number {
        // Calculation with some javascript rounding magic
        return this.gamesPlayed > 0 ? Math.round(this.gamesWon / this.gamesPlayed * 10000) / 100 : 0;
    }

    public generateNewSnipe() {
        this.currentSnipe = Math.floor(Math.random() * 99) + 1;
    }
}

let game = (robot: Robot) => {
    
    // If the brain has no knowledge of sniperino, create it
    if (robot.brain.get("sniperino") == null) {
        robot.brain.set("sniperino", {});
    }
    
    // Create a constant sniperino
    let sniperino = robot.brain.get("sniperino");

    // Get a sniper with a given name. If one doesn't exist, create it.
    let getOrCreateSniper = (user: User, create: boolean) => {
    
        // Check for active sniper, if not, create one
        if (sniperino[user.id] == null && create) {
            sniperino[user.id] = new Sniper(user);
        }
        return sniperino[user.id];
    }

    // Respond to a stats message
    robot.respond(/sniperino stats( me)?/i, (res) => {

        let stats = Object.keys(sniperino)
            .sort((a, b) => sniperino[b].getWinRate() - sniperino[a].getWinRate())
            .map((n) => `${sniperino[n].name}: ${sniperino[n].getWinRate()}%`);
      
        res.send(stats.join("\n"));

    });

    // Respond to a sniperino message
    robot.respond(/sniperino( me)?$/i, (res) => {

        // Define instance of our Sniper object from getSniper method
        let sniper = getOrCreateSniper(res.message.user, true);

        // Deny the play if someone is already actively sniping. Otheriwise, display their roll.
        if (sniper.currentSnipe == undefined) {
            
            // Player isn't playing, start a game for them
            sniper.generateNewSnipe();
        
            // Send their game information
            res.send(`ヽ༼ຈل͜ຈ༽_•︻̷̿┻̿═━一 ༼ つ ಥ_ಥ ༽つ${sniper.name}, roll higher than a ${sniper.currentSnipe} or the donger gets it!`);    
        }
        else {
            // Player is already playing, yell at them because they are an idiot
            res.send(`(ノಠ益ಠ)ノ彡┻━┻ YOU ARE ALREADY PLAYING SNIPERINO, ${sniper.name}. I oughtta sniperino YOU! ༼ຈل͜ຈ༽_•︻̷̿┻̿═━一`);
        }
    });

    robot.on("roll", (res, roll, max) => {
        
        // Get our currently rolling sniper
        let sniper = getOrCreateSniper(res.message.user, false);
       
        // If this is a valid sniperino roll and we have an active sniperino, resolve the game 
        if (max == 100 && sniper.currentSnipe) {
        
            if (roll > sniper.currentSnipe) {
                res.send(`(◠‿◠✿) ${sniper.name}, you roll a ${roll} and the donger lives! The donger thanks you (◠‿◠✿)`);
                sniper.gamesWon += 1;
            }
            else if (roll == sniper.currentSnipe) {
                res.send(`ヽ༼ຈل͜ຈ༽/ ${sniper.name}, you roll a ${roll} and tie! The donger is merely wounded. He will recover! ヽ༼ຈل͜ຈ༽/`);
            }
            else {
                res.send(`༼ つ x_x ༽つThe donger is dead. ${sniper.name}, you did this! You MONSTER! ༼ つ x_x ༽ つ`);
            }
         
            sniper.gamesPlayed += 1;
            sniper.currentSnipe = null; 
        }
    });
};

export = game;
