import { VoiceChannel } from "discord.js";
import { inject, injectable } from "inversify";
import ChannelManager from "../channelManager";
import { ChannelManagerTag } from "../tags";
import { Readable, Transform, TransformCallback, TransformOptions } from 'stream'
import { SpeechClient } from '@google-cloud/speech';
import { google } from '@google-cloud/speech/build/protos/protos';

const AudioEncoding = google.cloud.speech.v1.RecognitionConfig.AudioEncoding;

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
   
    return new Promise<string>((resolve, reject) => {
      let client = new SpeechClient();
      const request = {
        config: {
          encoding: AudioEncoding.LINEAR16,
          sampleRateHertz: 48000,
          languageCode: 'en-US',
        }
      };

      const recognizeStream = client.streamingRecognize(request)
      .on('error', console.error)
      .on('data', data => {
          data.results[0] && data.results[0].alternatives[0]
            ? resolve(`Transcription: ${data.results[0].alternatives[0].transcript}\n`)
            : '\n\nReached transcription time limit, press Ctrl+C\n'
      });

      voice.on('speaking', (user, speaking) => {
        if (speaking) {
          const audio = voice.receiver.createStream(user, { mode: 'pcm' });
          const convertTo1ChannelStream = new ConvertTo1ChannelStream();

          audio.pipe(convertTo1ChannelStream).pipe(recognizeStream);

          audio.on('end', () => { 
            this.voiceChannel.leave();
          });

          audio.on('error', () => {
            reject('An error occurred while listening to dictation');
          });
        }
      });
    });
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

function convertBufferTo1Channel(buffer: Buffer) {
  const convertedBuffer = Buffer.alloc(buffer.length / 2);

  for (let i = 0; i < convertedBuffer.length / 2; i++) {
    const uint16 = buffer.readUInt16LE(i * 4);
    convertedBuffer.writeUInt16LE(uint16, i * 2);
  }

  return convertedBuffer;
}

class ConvertTo1ChannelStream extends Transform {
  constructor(_?: any, options?: TransformOptions) {
    super(options);
  }

  _transform(data: Buffer, _: BufferEncoding, next: TransformCallback) {
    next(null, convertBufferTo1Channel(data));
  }
}