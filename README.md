# Reddit to Instagram Bot
This is a slightly revised Instagram bot that sources images from Reddit.  The original bot was created by [Freek Bes](https://github.com/FreekBes) and can be found [here](https://github.com/FreekBes/insta_reddit_bot). I've removed direct conversion through ffmpeg and added a library for working with ffmpeg via API (might not be the best solution). Also, we parse posts through the official Reddit API, so you will need to create your own application on Reddit.


## Requirements

The following software needs to be installed on your system in order for this bot to work:
- [NodeJS](https://nodejs.org/)
- [npm](https://www.npmjs.com/get-npm) (often included with NodeJS)


## Installation

> **Disclaimer:** by using this bot, you will not have control over what your account will be posting - the bot will post whatever the subreddit(s) you choose to mirror from upvotes. In essence, this means that sometimes the bot might post pictures that do not follow [Instagram's Terms of Service](https://help.instagram.com/477434105621119), which could result in Instagram taking action against your account, such as permanently deleting it. By using this bot, you agree with the fact that I am not responsible for any damages to your account(s) or other possessions in any means, whatever the cause.

Copy the file *settings.template.json*, name it *settings.json* and replace the fields that start with *ENTER_* for your desired result:
```
- ENTER_INSTAGRAM_USERNAME_HERE: your Instagram username
- ENTER_INSTAGRAM_PASSWORD_HERE: your Instagram password
- ENTER_RANDOM_WORD_HERE: a random word, like spaghetti or meatballs or whatever
- ENTER_A_SUBREDDIT_HERE: a subreddit to mirror posts from
```

And you will need to add Reddit Credentials:

```
"credentials": {
    "userAgent": "enter your user agent (jusy any word)",
    "clientId": "enter your Reddit App Client ID",
    "clientSecret": "enter your Reddit Api Secret Key",
    "username": "enter your reddit username",
    "password": "enter your reddit password"
  }
```

Please note that two-factor authentication is not supported, so disable that for any account you plan on using. Also, I shouldn't have to mention this, but be careful showing/sharing any of the contents from this file - it does contain your password.


### Mirroring from multiple subreddits

Ever since version 0.2.0 of this bot, mirroring from multiple subreddits is supported. To set this up, modify the subreddits in *settings.json* like the example below:

```
"subreddits": {
  "/r/me_irl": 30,
  "/r/meirl": 40,
  "/r/hmmm": 25
  "/r/ik_ihe": 5
}
```

The number behind the subreddit's name is the chance of the subreddit being chosen by the bot during runtime. All the chances combined together must equal 100 (30+40+25+5=100), otherwise the bot will purposefully run into an error (a total of >100 might cause performance issues, eventually).

This means you can mirror from a maximum of 100 subreddits from a single bot instance (when every subreddit's chance equals 1).


### Automating the bot: scheduling

Previously, you had to automate the bot by using cron on Linux. Ever since version 0.3.0, the bot acts like a service on your computer, instead of a script. This means the automation tool is now built-in. To modify the times at which the bot posts, please take a look at the `hourly_timings` field in *settings.json*. Every row listed there, equals one hour. Every number in between the square brackets, is a minute at which the bot will post. An example:

```
"hourly_timings": [
  [12, 32, 52],
  [12, 32],
  [12, 45],
  [4],
  [],
  [50],
  [10],
  [30, 34, 38],
  ...
```

In this example, the bot would post at 0:12, 0:32, 0:52, 1:12, 1:32, 2:12, 2:45, 3:04, 5:50, 6:10, 7:30, 7:34 and 7:38. There's 24 rows in `hourly_timings`, so as you might have guessed, this schedule is in a 24-hour format. The bot expects 24 rows to be present at all times. In order to not post at specific hours, just remove all the numbers from in between the square brackets (so that it becomes an empty array, like in the example at 4 'o clock).


### Discord integration

For moderation purposes, this bot includes a Discord integration, which you can enable in *settings.json*. To make it work, create a new application in the [Discord Developer Portal](https://discord.com/developers/applications/), add a bot and set the token accordingly in *settings.json*. In your Discord server, create two text channels: one for sending commands to the bot, and one for system messages (from the bot itself). Right-click these channels, and copy the ID. Enter those in *settings.json*. Then add the bot to your server (use the OAuth2 section in the Discord Developer Portal to easily do this).

#### Commands
- !blacklist <redditPostUrl/redditPostId>: add a post from Reddit to the blacklist. This post will not get uploaded to Instagram.
- !ping: check if the bot is up and running.

To view more commands, use !help.



## Running the bot

To run the bot, simply run the command `node bot.js` in the project's folder. To keep the bot running in the background, please check [this Stack Overflow page](https://stackoverflow.com/questions/4018154/how-do-i-run-a-node-js-app-as-a-background-service).



## Please do not use this library for spamming purposes

I did not create this library to spam Instagram. Please respect this, and do not use it to flood Instagram with posts. Posting a maximum of 3 times an hour should be more than enough.



## Explanation of all settings in *settings.json*

### Instagram

- username: Instagram username
- password: Instagram password, in plaintext
- seed: a random seed which is used to generate a fake device to sign in from
- credits_in_caption: whether or not the credits are included in the caption. If the value here is `false`, the credits will be posted as comment. There's no way to disable credits.
- credits_format: the format string for the credits posted in the caption or comments. %subreddit% will get replaced by the subreddit's name, %user% by the username of the user who posted the mirrored post, and %url% with a shortlink to this post. Other than that, you can do with this string as you want! Make it your language, add other stuff, whatever you need.
- restart_every: a number which states how many hours need to pass before relogging in to Instagram (due to a session timeout). Currently not used.

### Reddit

- subreddits: the subreddits to mirror from. See [mirroring from multiple subreddits](https://github.com/FreekBes/insta_reddit_bot#mirroring-from-multiple-subreddits) for a more in-depth explanation.

### Discord

- enabled: if `true`, Discord integration will be enabled
- token: a Discord bot token, generated in the [Discord Developer Portal](https://discord.com/developers/applications/) (under the bot section)
- prefix: the prefix used by the bot for commands. Defaults to `!`.
- channels > commands: a channel ID in a Discord server, used for sending commands to the bot
- channels > system: a channel ID in a Discord server, used for sending system messages to the Discord server

### Schedule

- human_error: currently not used
- hourly_timings: the schedule which the bot will follow for posts. See [automating the bot](https://github.com/FreekBes/insta_reddit_bot#automating-the-bot) for a more in-depth explanation.



## F.A.Q.

### How do I start the bot automatically at boot?

Use cron. Here's a guide: https://www.cyberciti.biz/faq/linux-execute-cron-job-after-system-reboot/

### I'm getting the IgActionSpamError or IgSentryBlockError error. How can I fix this?

Replace the `seed` value in *settings.json* (under `instagram`). Then remove *handlers/cookies.json* and restart the bot. If If this does not fix your issue, it might be your IP-address that has been blocked from using Instagram's services. There's no way to circumvent this, except from using a VPN or proxy for your bot.

### How do I add hashtags or modify the credits line?

Modify [handlers/instagram.js](https://github.com/FreekBes/insta_reddit_bot/blob/master/handlers/instagram.js). If you wish to modify the caption's text, modify line 177, else if you wish to change the comment's text, modify line 21.

### My Instagram account has been banned, what do I do?

If it's the account that has been banned, there's nothing more you can do other than [contacting Instagram and appealing the ban](https://help.instagram.com/contact/606967319425038), or creating a new account. Use this bot at your own risk, and try not to spam using it.

### Need more help?

If you've encountered an issue with the bot that's probably linked to the code, check the [Issues](https://github.com/FreekBes/insta_reddit_bot/issues) if the issue has been solved before, and if not, [create a new one](https://github.com/FreekBes/insta_reddit_bot/issues/new/choose).
If you need any more help setting up your bot, feel free to send me a message on Instagram! You can find me at [@freekbes](https://www.instagram.com/freekbes).



## Contributing

If you wish to contribute to this repository, feel free to go ahead. To debug a post, you can use `node bot.js -debug <redditPostId>`. The post will get downloaded and converted for Instagram, but it won't get uploaded. To actually upload to Instagram while debugging a post, add the `-forceig` flag. You can find the post ID of a Reddit post in the URL of the comment section, it's the piece of text after */comments/* up until the next */*-character.

If something's up with the Instagram side of things, run `npm script debug`. This will cause the bot to run with some arguments that specify the Instagram part to log more, for debugging purposes.
