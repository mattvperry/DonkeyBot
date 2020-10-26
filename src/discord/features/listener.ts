import { SpeechClient } from '@google-cloud/speech';
import { google } from '@google-cloud/speech/build/protos/protos';
import { VoiceChannel } from 'discord.js';
import { inject, injectable } from 'inversify';

import ChannelManager from '../channelManager';
import { ChannelManagerTag } from '../tags';
import { Readable, Transform, TransformCallback, TransformOptions } from 'stream';

const { AudioEncoding } = google.cloud.speech.v1.RecognitionConfig;
const DICTATION_ERROR_MESSAGE = `An error occurred while listening to dictation`;

interface SpeechStreamData {
    results: {
        alternatives: {
            transcript: string;
        }[];
    }[];
}
class Silence extends Readable {
    /* eslint-disable no-underscore-dangle */
    _read() {
        this.push(Buffer.from([0xf8, 0xff, 0xfe]));
    }
}

function convertBufferTo1Channel(buffer: Buffer) {
    const convertedBuffer = Buffer.alloc(buffer.length / 2);

    for (let i = 0; i < convertedBuffer.length / 2; i += 1) {
        const uint16 = buffer.readUInt16LE(i * 4);
        convertedBuffer.writeUInt16LE(uint16, i * 2);
    }

    return convertedBuffer;
}

class ConvertTo1ChannelStream extends Transform {
    constructor(_?: any, options?: TransformOptions) {
        super(options);
    }

    /* eslint-disable class-methods-use-this */
    _transform(data: Buffer, _: BufferEncoding, next: TransformCallback) {
        next(null, convertBufferTo1Channel(data));
    }
}

export class Listener {
    constructor(private voiceChannel: VoiceChannel) {}

    private async joinVoice() {
        return this.voiceChannel.join();
    }

    public async listen(): Promise<string> {
        const voice = await this.joinVoice();

        // Only works if we pipe in initial silence
        voice.play(new Silence(), { type: 'opus' });

        return new Promise<string>((resolve, reject) => {
            const client = new SpeechClient();
            const request = {
                config: {
                    encoding: AudioEncoding.LINEAR16,
                    sampleRateHertz: 48000,
                    languageCode: 'en-US',
                },
            };

            const recognizeStream = client
                .streamingRecognize(request)
                .on('error', console.error)
                .on('data', (data: SpeechStreamData) =>
                    data?.results[0]?.alternatives[0]
                        ? resolve(`Transcription:\n${data.results[0].alternatives[0].transcript}`)
                        : reject(new Error(DICTATION_ERROR_MESSAGE)),
                );

            voice.on('speaking', (user, speaking) => {
                if (speaking) {
                    const audio = voice.receiver.createStream(user, { mode: 'pcm' });
                    const convertTo1ChannelStream = new ConvertTo1ChannelStream();

                    audio.pipe(convertTo1ChannelStream).pipe(recognizeStream);

                    audio.on('end', () => {
                        this.voiceChannel.leave();
                    });

                    audio.on('error', () => {
                        reject(new Error(DICTATION_ERROR_MESSAGE));
                    });
                }
            });
        });
    }
}

@injectable()
export class ListenerFactory {
    constructor(@inject(ChannelManagerTag) private channels: ChannelManager) {}

    public createListener(channel: string): Listener | undefined {
        const games = this.channels.fetchByName(channel, 'voice');
        return games && new Listener(games);
    }
}
