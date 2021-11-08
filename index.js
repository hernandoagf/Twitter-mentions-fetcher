import { Client, Intents } from 'discord.js'
import { config } from 'dotenv'
import fetchTweets from './controller/fetchTweets.js'

config()

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

client.once('ready', () => {
  console.log(`Bot successfully started as ${client.user.tag}`)
  fetchTweets()
})

client.login(process.env.DISCORD_TOKEN)