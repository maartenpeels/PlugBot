//Made by Maarten Peels (skype: maarten-peels)

var songCount = 0;

var startTime = GetDate();

var afk = false;
var afkMessage = "I'm a bot.";
var afkTime = 60;//minutes
var version = "Made for plug.dj version: 0.9.X";

var disconnectLog = [];
var users = [];
var bannedUsers = [];
var joinQueue = [];
var history = [];

var moveId = "";
var moveTo = 1;

var waitListLength = 50;

var botName = API.getUser();

var sendMessages = true;
var antiSpam = false; //recommended when you have a big room

function Initialize(){
	GetUsers();
	setTimeout(HookEvents, 1000);
}

function HookEvents(){
	API.on(API.CHAT, OnMessage);
	API.on(API.USER_JOIN, OnUserJoin);
	API.on(API.CHAT_COMMAND, OnCommand);
	API.on(API.DJ_ADVANCE, OnDJAdvance);
	API.on(API.WAIT_LIST_UPDATE, OnWaitlistUpdate);
	API.on(API.USER_LEAVE, OnUserLeave);
	setTimeout(Sleep, 200);
	API.chatLog("Loaded! "+ version);
	Message("Bot online!", messageStyles.ME, null);
}

function GetUsers(){
	API.getUsers().forEach(function(usr) {
    	users.push({"user": usr, "inRoom": true, "lastChat": new Date().getTime(), "afkWarnings": 0});
	});
}
function Sleep(){}

function Die(){
	Message("Unhooking Events..", messageStyles.LOG, null);
	API.off(API.CHAT, OnMessage);
	API.off(API.USER_JOIN, OnUserJoin);
	API.off(API.CHAT_COMMAND, OnCommand);
	API.off(API.DJ_ADVANCE, OnDJAdvance);
	API.off(API.WAIT_LIST_UPDATE, OnWaitlistUpdate);
	API.off(API.USER_LEAVE, OnUserLeave);
	setTimeout(Sleep, 200);
	Message("Clearing bot data..", messageStyles.LOG, null);
	disconnectLog = [];
	users = [];
	history = [];
	setTimeout(Sleep, 200);
	Message("Done, consider me dead!", messageStyles.LOG, null);
}
function AfkCheck(){
	for (var i = 0; i < users.length; i++) {
		var usrr = users[i].user;
		var now = new Date();
		var lastActivity = users[i].lastChat;
    	var timeSinceLastActivity = now.getTime() - lastActivity;
    	var secsLastActive = timeSinceLastActivity / 1000;
    	var minsLastActive = secsLastActive/60;
    	if(minsLastActive > afkTime && usrr.username != API.getUser().username){
    		if(API.getWaitListPosition(users[i].user.id) != -1){
    			fiveMinutes = 5; 
    			tenMinutes = 10;
    			if(minsLastActive > afkTime+tenMinutes && users[i].afkWarnings == 2){
					if(!antiSpam) Message("you're AFK, you will be removed in 5 seconds!", messageStyles.MENTION, usrr.username);
					users[i].afkWarnings = 3;
    			}else if(minsLastActive > afkTime+fiveMinutes && users[i].afkWarnings == 1){
					if(!antiSpam) Message("AFK time: "+msToStr(secsLastActive*1000)+", chat within 5 minutes or you will be removed from waitlist!", messageStyles.MENTION, usrr.username);
					users[i].afkWarnings = 2;
    			}else if(minsLastActive > afkTime && users[i].afkWarnings == 0){
					Message("AFK time: "+msToStr(secsLastActive*1000)+", chat within 10 minutes or you will be removed from waitlist!", messageStyles.MENTION, usrr.username);
					users[i].afkWarnings = 1;
    			}else if(minsLastActive > afkTime+tenMinutes && users[i].afkWarnings == 3){
    				API.moderateRemoveDJ(usrr.id);
    				users[i].afkWarnings = 0;
    			}
    		}
    	}

    	if(API.getWaitListPosition(users[i].user.id) == -1){
    		users[i].lastChat = new Date().getTime();
    	}
	}
}
function Checks(){
	//joinQueue
	if(joinQueue.length > 0){
		LockBooth();
		var list = API.getWaitList();
		if(list.length < waitListLength){
			var user = joinQueue.shift();
			AddUser(user.user, user.position);
		}
	}else{
		UnlockBooth();
	}
}
setInterval(AfkCheck, 5000);
setInterval(Checks, 2000);

//HOOKS
function OnMessage(data){//http://support.plug.dj/hc/en-us/categories/200123567-API#chat
	msg = data.message;
	if(StartsWith(msg, "!")){
		API.moderateDeleteChat(data.chatID);
		if(HasPermision(API.getUser(data.fromID)) || (data.message.indexOf("dclookup") != -1 && data.message.indexOf("@") == -1)){
			OnUserCommand(data);
		}else{
			//Message("["+data.from+"] insufficient permissions!", messageStyles.NORMAL, null);
		}
		return;
	}

	if(afk && StartsWith(msg, "@"+API.getUser().username)){
		Message(afkMessage, messageStyles.MENTION, data.from);
	}

    if (msg.indexOf('fan me') !== -1 || msg.indexOf('fan for fan') !== -1 || msg.indexOf('fan pls') !== -1 || msg.indexOf('fan4fan') !== -1 || msg.indexOf('add me to fan') !== -1 || msg.indexOf('fan 4 fan') !== -1) {
    	var m = "please don't ask for fans.";
    	API.moderateDeleteChat(data.chatID);
        Message(m, messageStyles.MENTION, data.from);
    }

    for (var i = 0; i < users.length; i++) {
		if(users[i].user.username == data.from){
			users[i].lastChat = new Date().getTime();
		}
	}
}
function OnCommand(text){
	console.debug(text);
}
function OnDJAdvance(data){//http://support.plug.dj/hc/en-us/categories/200123567-API#djadvance
	if (data == null) return;
	songCount+=1;
	var score = data.lastPlay.score;
	history.push({"data": data, "positive": score.positive, "negative": score.negative, "curates": score.curates});
}
function OnUserCommand(data){//Needs data from OnMessage()
	var args = data.message.trim().split(" ");
	args[0] = args[0].substring(1, args[0].length);

	switch(args[0])
	{
		case "dclookup":
			dclookup(args, data);
			break;
		case "skip":
			skip(args, data);
			break;
		case "die":
			Die();
			break;
		case "afk":
			userAfk();
			break;
		case "back":
			userBack();
			break;
		case "msg":
			Msg();
			break;
		case "lock":
			LockBooth();
			break;
		case "unlock":
			UnlockBooth();
			break;
		case "swap":
			swap(args, data);
			break;
		case "status":
			status();
			break;
		case "add":
			addUser(args, data);
			break;
		case "history":
			songHistory(args, data);
			break;
		case "credits":
			credits();
			break;
		case "kicksong":
			kicksong();
			break;
		case "moveback":
			moveback(args, data);
			break;
		default:
			Message("["+data.from+"] error: Unknown command("+args[0]+")", messageStyles.NORMAL, null);
			break;
	}
}
function OnUserLeave(user){
	for (var i = 0; i < disconnectLog.length; i++) {
		if(disconnectLog[i].user.username == user.username){
			disconnectLog[i].used = 1;
		}
	}
	for (var i = 0; i < users.length; i++) {
		if(users[i].user.username == user.username){
			users[i].inRoom = false;
		}
	}
	disconnectLog.push({"user": user, "totalSongs": songCount, "waitlist": API.getWaitListPosition(user.id), "used": 0, "time": GetDate()});
}
function OnUserJoin(user){
	for (var i = 0; i < users.length; i++) {
		if(users[i].user.username == user.username){
			users[i].inRoom = true;
		}else{
			users.push({"user": user, "inRoom": true, "lastChat": new Date().getTime(), "afkWarnings": 0});
		}
		break;
	}
}
function OnWaitlistUpdate(){

}

//COMMANDS
function Afk(){
	if(API.getUser().permission == 5){
		afk = !afk;
		if(afk){
			Message("I'm AFK now, brb!", messageStyles.LOG, null);
		}else{
			Message("Hey, I'm back!", messageStyles.LOG, null);
		}
	}
}
function credits(){
	Message("This bot was made by: Maarten Peels (skype: maarten-peels)", messageStyles.ME, null);
}
function Msg(){
	if(API.getUser().permission == 5){
		sendMessages = !sendMessages;
		if(sendMessages){
			API.chatLog("Oke, I will send messages now..");
		}else{
			API.chatLog("Oke Oke, I will stop spamming!");
		}
		
	}
}
function dclookup(args, data){
	var user;
	if(args.length == 1){
		for (var i = 0; i < users.length; i++) {
		    if(users[i].user.username == data.from){
		    	user = users[i].user;
		    	break;
		    }
		}
		for (var i = 0; i < disconnectLog.length; i++) {
			if(disconnectLog[i].user.username == user.username && disconnectLog[i].used == 0){
				var extra = "";
				if((songCount-disconnectLog[i].totalSongs) > 1 || (songCount-disconnectLog[i].totalSongs) == 0){
					extra = "s";
				}
				if(disconnectLog[i].waitlist != -1){
					var list = API.getWaitList();
					if(list.length < waitListLength){
						return LockBooth(function() {
			            	API.moderateAddDJ(user.id);
							return setTimeout(function() {
								Move(user, disconnectLog[i].position);
			              		return setTimeout(function() {
			                		return UnlockBooth();
			              		}, 1500);
							}, 1500);
		           		});
					}else{
						joinQueue.push({"user": user, "position": parseInt(args[2])});
					}
					return;
				}else{
					if(!antiSpam)Message(user.username + " disconnected " + (songCount-disconnectLog[i].totalSongs) + " song"+extra+" ago, he/she wasn't on the waitlist!", messageStyles.NORMAL, null);
					return;
				}
				break;
			}
		}
		if(!antiSpam)Message("I didn't see "+user.username+" disconnect!", messageStyles.NORMAL, null);
		return;
	}else if(args.length > 2 || args.length < 2){
		Message("["+data.from+"] usage: !dclookup @{username}", messageStyles.NORMAL, null);
	}else{
		args[1] = args[1].replace("@","");
		for (var i = 0; i < users.length; i++) {
		    if(users[i].user.username == args[1]){
		    	user = users[i];
		    	break;
		    }
		}
		if(user == null){
			Message("["+data.from+"] error: user not found("+args[1]+", not in room?)", messageStyles.NORMAL, null);
		}else{
			for (var i = 0; i < disconnectLog.length; i++) {
				if(disconnectLog[i].user.username == args[1] && disconnectLog[i].used == 0){
					var extra = "";
					if((songCount-disconnectLog[i].totalSongs) > 1 || (songCount-disconnectLog[i].totalSongs) == 0){
						extra = "s";
					}
					if(disconnectLog[i].waitlist != -1){
						Message(args[1] + " disconnected " + (songCount-disconnectLog[i].totalSongs) + " song"+extra+" ago, he/she was on position "+disconnectLog[i].waitlist+"!", messageStyles.NORMAL, null);
						return;
					}else{
						Message(args[1] + " disconnected " + (songCount-disconnectLog[i].totalSongs) + " song"+extra+" ago, he/she wasn't on the waitlist!", messageStyles.NORMAL, null);
						return;
					}
					break;
				}
			}
			Message("I didn't see "+args[1]+" disconnect!", messageStyles.NORMAL, null);
			return;
		}
	}	
}
function kicksong(){
	var dj = API.getDJ();
	return setTimeout(function() {
		EnableCycle();
  		return setTimeout(function() {
  			Message("song skipped, you will be placed 3rd in waitlist. Choose a different song!", messageStyles.MENTION, dj.username);
  			API.moderateForceSkip();
  			Move(dj, 3);
  			return setTimeout(function() {
        		return DisableCycle();
      		}, 1500);
  		}, 1500);
	}, 1500);
}
function skip(args, data){
	if(args.length == 1){
		//Message("DJ skipped, no reason given!", messageStyles.NORMAL, null);
	}else{
		var reason = "";
		for(var i = 1; i < args.length; i++){
			reason += args[i] + " ";
		}
		Message("DJ skipped, reason: " + reason, messageStyles.NORMAL, null);
	}
	API.moderateForceSkip();
}
function swap(args, data){
	if(args.length != 4){
		Message("["+data.from+"] usage: !swap @{userRemove} for @{userAdd}", messageStyles.NORMAL, null);
	}else{
		user1 = args[1].substring(1,args[1].length);
		user2 = args[3].substring(1,args[3].length);
		var userAdd = null;
		var userRemove = null;
		var userRemovePos = null;

		for (var i = 0; i < users.length; i++) {
		    if(users[i].user.username == user1){
		    	userRemove = users[i].user;
		    	userRemovePos = API.getWaitListPosition(userRemove.id);
		    	break;
		    }
		}
		for (var i = 0; i < users.length; i++) {
		    if(users[i].user.username == user2){
		    	userAdd = users[i].user;
		    	break;
		    }
		}
		if(userRemove == null || userAdd == null && userRemovePos == -1){
			Message("["+data.from+"] error parsing one or both names!", messageStyles.NORMAL, null);
		}else{
			return LockBooth(function() {
            	API.moderateRemoveDJ(userRemove.id);
				Message("Removing " + userRemove.username + "...", messageStyles.NORMAL, null);
				return setTimeout(function() {
					API.moderateAddDJ(userAdd.id);
              		Message("Adding " + userAdd.username + "...", messageStyles.NORMAL, null);
              		return setTimeout(function() {
              			Move(userAdd, userRemovePos);
              			return setTimeout(function() {
	                		return UnlockBooth();
	              		}, 1500);
              		}, 1500);
				}, 1500);
           });
		}
	}
}
function status(){
	Message("Runing since: " + startTime, messageStyles.ME, null);
	//Message(" ", messageStyles.ME, null);
	Message(users.length + " users since startup!", messageStyles.ME, null);
	var online = 0;
	for (var i = 0; i < users.length; i++) {
	    if(users[i].inRoom == true){
	    	online+=1;
	    }
	}
	Message(online + " are in the room right now..", messageStyles.ME, null);
	Message(disconnectLog.length + " disconnects since startup!", messageStyles.ME, null);
}
function addUser(args, data){
	if(args.length != 3){
		Message("["+data.from+"] usage: !add @{user} {position}", messageStyles.NORMAL, null);
	}else{
		var user = null;
		args[1] = args[1].replace("@","");
		for (var i = 0; i < users.length; i++) {
		    if(users[i].user.username == args[1]){
		    	user = users[i].user;
		    	break;
		    }
		}
		if(user != null){
			var list = API.getWaitList();
			if(list.length < waitListLength){
				return LockBooth(function() {
	            	API.moderateAddDJ(user.id);
					return setTimeout(function() {
						Move(user, args[2]);
	              		return setTimeout(function() {
	                		return UnlockBooth();
	              		}, 1500);
					}, 1500);
           		});
			}else{
				joinQueue.push({"user": user, "position": parseInt(args[2])});
			}
		}else{
			Message("["+data.from+"] error: user not found("+args[1]+", not in room?)", messageStyles.NORMAL, null);
		}
	}
}
function songHistory(args, data){
	if(args.length == 2){
		var pos = parseInt(args[1]);
		var l = history.length;
		var song = null;
		if(pos > 0 && pos < l+1){
			if((l-(l-pos)) >= 0){
				song = history[l-pos];
			}
			if(song != null){
				var d = song.data;
				var userName = d.dj.username;
				var songName = d.media.title;
				var songAuthor = d.media.author;
				var woots = song.positive;
				var mehs = song.negative;
				var curates = song.curates;
				Message(pos + " songs ago, " + userName + " played " + songName + " by " + songAuthor + ". " + woots + " positive, " + mehs + " negative, " + curates + " curates!", messageStyles.NORMAL, null);
			}
		}else{
			Message("["+data.from+"] error: enter a number between 1 and the history array length(current length: "+l+")", messageStyles.NORMAL, null);
		}
	}else{
		Message("["+data.from+"] usage: !history {songsAgo}", messageStyles.NORMAL, null);
	}
}
function moveback(args, data){
	if(args.length == 3){
		var user = null;
		name = name.replace("@","");
		for (var i = 0; i < users.length; i++) {
		    if(users[i].user.username == name){
		    	user = users[i].user;
		    	break;
		    }
		}
		if(user != null){
			var position = API.getWaitListPosition(user.id);
			if(position == -1){
				var pos = position-parseInt(args[2]);
				console.debug(user.id + " - " + pos);
				//Move(user, pos); 
			}
		}
	}else{
		Message("["+data.from+"] usage: !moveback @{user} {spotsBack}", messageStyles.NORMAL, null);
	}
}

//Usefull Functions
var messageStyles = {
  LOG : "LOG", 
  NORMAL: "NORMAL", 
  ERROR : "ERROR",
  ME : "ME",
  MENTION : "MENTION"
};
function Message(text, type, user){
	if(sendMessages){
		if(type == messageStyles.LOG){
			API.chatLog(text, false);
		}else if(type == messageStyles.NORMAL){
			API.sendChat(text);
		}else if(type == messageStyles.ERROR){
			API.chatLog(text, true);
		}else if(type == messageStyles.ME){
			API.sendChat("/me " + text);
		}else if(type == messageStyles.MENTION && user != null){
			API.sendChat("@"+user+" "+text);
		}else if(type == null){
			API.chatLog(text, false);
		}else{
			API.chatLog("An error occurred sending the message!", true);
		}
	}else{
		console.debug(text);
	}
}
function StartsWith(input, check){
	if(input.substring(0, check.length) === check){
		return true;
	}else{
		return false;
	}
}
function GetDate(){
	var now = new Date();
	return now;
}
function HasPermision(user){
	if(user.permission > 2){
		return true;
	}else{
		return false;
	}
}
function LockBooth(){
	API.moderateLockWaitList(true);
}
function UnlockBooth(){
	API.moderateLockWaitList(false);
}
function Move(user, pos){
	moveId = user.id;
	moveTo = parseInt(pos);
	moveUser();
}
DisableCycle = function(callback) {
  if (callback == null) {
    callback = null;
  }
  return $.ajax({
    url: "http://plug.dj/_/gateway/room.cycle_booth",
    type: 'POST',
    data: JSON.stringify({
      service: "room.cycle_booth",
      body: [
        window.location.pathname.replace(/\//g, ''),
        false
      ]
    }),
    async: this.async,
    dataType: 'json',
    contentType: 'application/json'
  }).done(function() {
    if (callback != null) {
      return callback();
    }
  });
};
EnableCycle = function(callback) {
  if (callback == null) {
    callback = null;
  }
  return $.ajax({
    url: "http://plug.dj/_/gateway/room.cycle_booth",
    type: 'POST',
    data: JSON.stringify({
      service: "room.cycle_booth",
      body: [
        window.location.pathname.replace(/\//g, ''),
        true
      ]
    }),
    async: this.async,
    dataType: 'json',
    contentType: 'application/json'
  }).done(function() {
    if (callback != null) {
      return callback();
    }
  });
};
function Move(user, pos){
	moveId = user.id;
	moveTo = parseInt(pos);
	moveUser();
}
moveUser = function(callback) {
  if (callback == null) {
    callback = null;
  }
  return $.ajax({
    url: "http://plug.dj/_/gateway/moderate.move_dj",
    type: 'POST',
    data: JSON.stringify({
      service: "moderate.move_dj",
      body: [
        moveId,
        moveTo,
      ]
    }),
    async: this.async,
    dataType: 'json',
    contentType: 'application/json'
  }).done(function() {
    if (callback != null) {
      return callback();
    }
  });
};
msToStr = function(msTime) {
    var ms, msg, timeAway;
    msg = '';
    timeAway = {
      'days': 0,
      'hours': 0,
      'minutes': 0,
      'seconds': 0
    };
    ms = {
      'day': 24 * 60 * 60 * 1000,
      'hour': 60 * 60 * 1000,
      'minute': 60 * 1000,
      'second': 1000
    };
    if (msTime > ms['day']) {
      timeAway['days'] = Math.floor(msTime / ms['day']);
      msTime = msTime % ms['day'];
    }
    if (msTime > ms['hour']) {
      timeAway['hours'] = Math.floor(msTime / ms['hour']);
      msTime = msTime % ms['hour'];
    }
    if (msTime > ms['minute']) {
      timeAway['minutes'] = Math.floor(msTime / ms['minute']);
      msTime = msTime % ms['minute'];
    }
    if (msTime > ms['second']) {
      timeAway['seconds'] = Math.floor(msTime / ms['second']);
    }
    if (timeAway['days'] !== 0) {
      msg += timeAway['days'].toString() + 'd';
    }
    if (timeAway['hours'] !== 0) {
      msg += timeAway['hours'].toString() + 'h';
    }
    if (timeAway['minutes'] !== 0) {
      msg += timeAway['minutes'].toString() + 'm';
    }
    if (timeAway['seconds'] !== 0) {
      msg += timeAway['seconds'].toString() + 's';
    }
    if (msg !== '') {
      return msg;
    } else {
      return false;
    }
};
function AddUser(user, pos){
	API.moderateAddDJ(user.id);
	return setTimeout(function() {
		Move(user, pos);
	}, 1500);
}

Initialize();