import { VoiceChannel } from "discord.js";
import { inject, injectable } from "inversify";
import ChannelManager from "../channelManager";
import { ChannelManagerTag } from "../tags";
import { Readable } from 'stream'

export class Listener {
  constructor(
    private voiceChannel: VoiceChannel
    ) {}

  private async joinVoice() {
    return await this.voiceChannel.join();
  }

  public async listen() {
    const voice = await this.joinVoice();

    // Only works if we pipe in initial silence
    voice.play(new Silence(), { type: 'opus' });
   
    let buffer: any[] = [];
    const p = new Promise<string>((resolve, reject) => {
      voice.on('speaking', (user, speaking) => {
        if (speaking) {
          const audio = voice.receiver.createStream(user,  { mode: 'pcm' });

          audio.on('data', (chunk) => {
            console.log(chunk);
            buffer = buffer.concat(chunk);
          });
    
          audio.on('end', () => { 
            this.voiceChannel.leave();
            
            // figure out how to read the buffer into speech recognition

            return resolve("Done listening!");
          });
          
          audio.on('error', () => {
            reject('An error occurred while listening to dictation');
          });
        }
      }); 
    });

    return p;
  } 
}

@injectable()
export class ListenerFactory {
    constructor(
      @inject(ChannelManagerTag) private channels: ChannelManager
    ) {}

    public createListener(channel: string): Listener | undefined {
        const games = this.channels.fetchByName(channel, 'voice');
        return games && new Listener(games);
    }
}

class Silence extends Readable {
  _read() {
    this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
  }
}