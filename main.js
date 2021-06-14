const { TwitterClient } = require('twitter-api-client');
const fs = require('fs');
require('dotenv').config();

// these need to be gqthered from the Twitter Developer Portal and put in your own .env file
const twitterClient = new TwitterClient({
  apiKey: process.env.TWITTER_API_KEY,
  apiSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
});

const IN_PATH = 'input.json';
const OUT_PATH = 'output.json';

async function main(){
  const input = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'));
  const CHUNK_SIZE = 100;
  const lookups = [];
  var lookupChunk = [];
  input.forEach(entry => {
    if(entry.signature.startsWith('@')){
      if(lookupChunk.length >= CHUNK_SIZE){
        lookups.push(lookupChunk);
        lookupChunk = [];
      }
      // trim the @ for ease of POSTing
      lookupChunk.push(entry.signature.substr(1));
    }
  });
  // push last chunk, if we have one left
  if(lookupChunk.length > 0){
    lookups.push(lookupChunk);
  }
  // Search for up to 100 users at a time
  // (can't use forEach due to async)
  for(const chunk of lookups){
    const data = await twitterClient.accountsAndUsers.usersLookup({ screen_name: chunk });
    data.forEach(entry => {
      input.filter(element => element.signature.toUpperCase() == `@${entry.screen_name}`.toUpperCase()).forEach(match => {
        match.imageUrl = entry.profile_image_url_https;
      });
    });
  }
  fs.writeFileSync(OUT_PATH, JSON.stringify(input, undefined, 2));
  console.log('done!')
}

main();