Plug.DJ Moderation Bot
==========================
Written by Maarten Peels


**If you have any issues with the bot you want to bring up with me, then open an issue on the issues tab above.**

#Overview
This bot is written to help:

1. Automate certain aspects of room moderation
2. Provide moderators additional tools to make their job easier
3. Track certain room statistics to optimize DJing experience (AFK status, disconnect logs, play history)

#Bot Features
--------------

###Bot Automation
####AFK Monitor
*When a user is on the waitlist and is not active(sending chat messages), he/she will be notified 2 times(10 and 5 minutes before removal), and will then be removed from the waitlist.

####History
*When a new DJ starts playing, all the info from the last will be added to a list. It will keep track of the user, the song, and the woots/mehs/curates

####Disconnect-log
*When a user disconnects, he/she will be added to a list, with the time of disconnect and waitlist position. This will be used by the 'dclookup' command

####User info
*The bot keeps track of some user info, if he/she is in the room or not, afk warnings, etc.

###Bot Automation
####dclookup
Usage: !dclookup @{username}
Function: looks up the user in the disconnect-log list, and will send result in chat as shown below.

1.{user} disconnected {songs} song(s) ago, he/she was on position {waitlist_pos}!
2.{user} disconnected {songs} song(s) ago, he/she wasn't on the waitlist!

####skip
*info

####die
*info

####lock
*info
 
####unlock
*info
 
####swap
*info
 
####status
*info

####add
*info
 
####history
*info
 
 
#How to run
------------------------------
To run the script in your webbrowser, you would have to make a new bookmark with the path to your `bot.js` file from, you can simply type:

```Javascript
javascript:$.getScript('[YOUR INCLUDE LOCATION]');
```

Into the bookmark url.  My file is usually on my server at `http://maartenpeels.nl/modbot.js`, so my include would be:

```Javascript
javascript:$.getScript('http://maartenpeels.nl/modbot.js');
```

That's all!
