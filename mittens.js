const { Client, GatewayIntentBits, VoiceChannel } = require('discord.js');
const express = require('express');
const axios = require('axios');
const { clientId, clientSecret, redirectUri, tokenEndpoint, token } = require('./config.json');
const { joinVoiceChannel, getVoiceConnections, createAudioPlayer, createAudioResource, getVoiceConnection } = require("@discordjs/voice");

class DiscordBot {
    constructor() {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
        this.intervalTimer = null;
        this.followUser = false;
        this.connection = false;
    }

    async start() {
        this.configureRoutes();
        this.configureClient();

        await this.client.login(token);
    }

    configureRoutes() {
        const app = express();
        const port = 3000;

        app.get('/auth/callback', async (req, res) => {
            const code = req.query.code;
            const params = new URLSearchParams();
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('redirect_uri', redirectUri);
            params.append('scope', 'bot'); // Add additional scopes if needed
        
            try {
            const tokenResponse = await axios.post(tokenEndpoint, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const accessToken = tokenResponse.data.access_token;
            res.send('Authentication successful!'); // Send a response to complete the authentication flow
            } catch (error) {
            console.error('Error exchanging code for access token');
            res.status(500).send('Error occurred during authentication');
            }
        });

        app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        });
    }

    configureClient() {
        this.client.once('ready', () => {
        console.log('Wild kitties appeared!');
        });

        this.client.on('messageCreate', (message) => {
            if (message.author.bot) return;

            if (message.content === '!kitty') {
                this.handleKittyCommand(message);
            } else if (message.content === '!shoo') {
                this.handleShooCommand(message);
            } else if (message.content.startsWith('!test') && message.mentions.users.size == 1) {
                this.handleTestCommand(message);
            }
        });
    }

    connectVoiceChannel(channel){
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
            volume: 0.1
        });
        console.log(`Joined voice channel: ${channel}`);
    }

    disconnectVoiceChannel(){
        if(!this.connection) return;
        this.connection.disconnect();
        this.connection = false;
        console.log('Kitty scattered off...');
    }

    async handleKittyCommand(message) {
        if (message.member.voice.channel) {
            const channel = message.member.voice.channel;


        }
    }
      

    handleShooCommand(message) {
        this.stopFollowing();
    }

    handleTestCommand(message) {
        if(message.mentions.everyone) return;
        
        const user = this.client.users.cache.get(message.mentions.users.first().id);
        if(!user) return;
        this.followUser = user;
        const guild = this.client.guilds.cache.get(message.guildId);
        if(!guild) return;
        this.followGuild = guild;
        this.startFollowing();
        message.channel.send('Imma be following '+ user.username + '. Give me treats');
    }

    

    async findActiveUser(){
        if(!this.followGuild || !this.followUser) return false;
        const member = this.followGuild.members.cache.get(this.followUser.id);
        if (member) {
            try {
                await member.fetch();

                if (member.voice.channel)
                    return member.voice.channel;
                else
                    return false;
                
            } catch (error) {
                console.error(error);
                return false;
            }
          } else {
            return false;
          }
          
    }

    async startFollowing() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }

        const voiceChannel = await this.findActiveUser();
        if(false !== voiceChannel){
            this.connectVoiceChannel(voiceChannel);
            this.playSound();
        }
        

        const connections = getVoiceConnections();
        const interval = 8500;

        this.intervalTimer = setInterval(async () => {
            if (this.followUser && this.followGuild) {
              const voiceChannel = await this.findActiveUser();
              if (voiceChannel !== false) {
                if (!this.connection || this.connection.joinConfig.channelId !== voiceChannel.id) { 
                  this.connectVoiceChannel(voiceChannel);
                }
                this.playSound();
              } else {
                if(this.connection)
                    this.disconnectVoiceChannel();
              }
            }
            
            
          }, interval);
    }

    playSound() {
        const soundFilePath = this.getRandomSoundFilePath();
        const audioResource = createAudioResource(soundFilePath, { inlineVolume: true });
        audioResource.volume.setVolume(0.3);
        const audioPlayer = createAudioPlayer();
        this.connection.subscribe(audioPlayer);
        audioPlayer.play(audioResource);
    }

    stopFollowing(){
        const connections = getVoiceConnections();

        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }

        connections.forEach((connection) => {
            connection.destroy();
        });
    }

    getRandomSoundFilePath() {
        const soundFiles = [
        './sounds/1.mp3',
        './sounds/2.mp3',
        './sounds/3.mp3',
        './sounds/4.mp3',
        './sounds/5.mp3',
        './sounds/6.mp3',
        './sounds/7.mp3',
        './sounds/8.mp3',
        './sounds/9.mp3',
        './sounds/10.mp3',
        './sounds/11.mp3',
        './sounds/12.mp3',
        './sounds/13.mp3',
        './sounds/14.mp3',
        './sounds/15.mp3'
        ];
        const randomIndex = Math.floor(Math.random() * soundFiles.length);
        return soundFiles[randomIndex];
    }

}


const bot = new DiscordBot();
bot.start();