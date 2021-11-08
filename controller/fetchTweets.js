import needle from 'needle'
import { config } from 'dotenv'
config()

const token = process.env.TWITTER_BEARER_TOKEN
const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream'

// const rules = [{
//   value: '@gu_stakes OR from:gu_stakes OR to:gu_stakes',
//   tag: 'from or mentions gustakes'
// }]
const rules = [{
  value: '@hernandoagf OR from:hernandoagf OR to:hernandoagf',
  tag: 'from or mentions hernandoagf'
}]

export default async function fetchTweets() {
  let currentRules;

  try {
      currentRules = await getAllRules();
      await deleteAllRules(currentRules);
      await setRules();
  } catch (e) {
      console.error(e);
      process.exit(1);
  }

  // Listen to the stream.
  streamConnect(0);
}

const getAllRules = async () => {
  const res = await needle('get', rulesURL, {
    headers: {
      'authorization': `Bearer ${token}`
    }
  })

  if (res.statusCode !== 200) throw new Error(res.body)

  return res.body
}

const deleteAllRules = async (rules) => {
  if (!Array.isArray(rules.data)) return null

  const ids = rules.data.map(rule => rule.id)
  const data = {
    delete: {
      ids
    }
  }

  const res = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`
    }
  })

  if (res.statusCode !== 200) throw new Error(res.body)

  return res.body
}

const setRules = async () => {
  const data = {
    add: rules
  }

  const res = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${token}`
    }
  })

  if (res.statusCode !== 201) throw new Error(res.body)

  return res.body
}

const streamConnect = (retryAttempt) => {
  const stream = needle.get(streamURL, {
    headers: {
      'User-Agent': 'v2FilterStreamJS',
      'Authorization': `Bearer ${token}`
    },
    timeout: 20000
  })

  stream.on('data', data => {
    try {
      const json = JSON.parse(data)
      console.log(json)
      // A successful connection resets retry count.
      retryAttempt = 0
    } catch (err) {
      if (data.detail === 'This stream is currently at the maximum allowed connection limit.') {
        console.log(data.detail)
        process.exit(1)
      } else {
        // Keep alive signal received. Do nothing.
      }
    }
  }).on('err', error => {
    if (error.code !== 'ECONNRESET') {
      console.log(error.code)
      process.exit(1)
    } else {
      setTimeout(() => {
        console.warn('A connection error occurred. Reconnecting...')
        streamConnect(++retryAttempt)
      }, 2 ** retryAttempt)
    }
  })

  return stream
}
