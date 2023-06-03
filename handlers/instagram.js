const path = require('path');
const fs = require('fs');
const igPrivateApi = require('instagram-private-api');
const igClient = new igPrivateApi.IgApiClient();
const temp = require("./temp.js");
const mediaDownloader = require("./mediadownloader.js");
const ffmpeg = require('fluent-ffmpeg');


// Функция для получения случайных хештегов из массива
function getRandomHashtags(hashtags, count) {
    const shuffled = hashtags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}


function getCookiesPath() {
	return path.join(__dirname, "cookies.json");
}

function cookiesExist() {
	return fs.existsSync(getCookiesPath());
}

function getCreditsString(redditHandler, username, postid) {
	let credits = creditsFormat.replace("%subreddit%", redditHandler.getSubreddit());
	credits = credits.replace("%user%", "/u/"+username);
	credits = credits.replace("%url%", "https://redd.it/"+postid);
	return credits;
}

let doCommentCredits = false;
let creditsFormat = null;
exports.commentCredits = function(redditHandler, instagramPostId, originalUploader, redditPostId) {
	return new Promise(function(resolve, reject) {
		igClient.media.comment({
			mediaId: instagramPostId,
			text: 'I hope you like it!'
		}).then(function(commentResponse) {
			resolve(commentResponse);
		}).catch(function(err) {
			reject(err);
		});
	});
};

exports.init = function(igSettings) {
	igClient.state.generateDevice(igSettings.userName + "_" + igSettings.seed);

	igClient.request.end$.subscribe(async function() {
		const serialized = await igClient.state.serializeCookieJar();
		delete serialized.version;
		fs.writeFileSync(getCookiesPath(), JSON.stringify(serialized));
	});

	if (!igSettings.credits_in_caption) {
		doCommentCredits = false;
	}
	creditsFormat = igSettings.credits_format;
};

function signInNewSession(username, password, resolve, reject) {
	console.log("Signing in to Instagram...");
	// execute all requests prior to authorization in the real Android application
	// igClient.simulate.preLoginFlow().then(function() {
		igClient.account.login(username, password).then(function() {
			// execute all requests after authorization in the real Android application
			// we're doing this on a next tick, as per the example given in instagram-private-api's tutorial...
			// process.nextTick(async function() {
				// await igClient.simulate.postLoginFlow();
			// });
			console.log("Signed in as " + username);
			resolve();
		})
		.catch(function(err) {
			reject(err);
		});
	// })
	// .catch(function(err) {
	// 	reject(err);
	// });
}

function signInFromSession(username, password, resolve, reject) {
	console.log("Checking if we're still signed in from a session...");
	igClient.account.currentUser()
		.then(function(res) {
			console.log("Still signed in as " + res.username + " (from session)");
			resolve();
		})
		.catch(function(err) {
			console.log("It appears not! Let's sign in again.");
			signInNewSession(username, password, resolve, reject);
		});
}

exports.signIn = function(username, password) {
	return new Promise(function(resolve, reject) {
		if (cookiesExist()) {
			console.log("Parsing cookies...");
			igClient.state.deserializeCookieJar(fs.readFileSync(getCookiesPath(), "utf8")).then(function() {
				signInFromSession(username, password, resolve, reject);
			});
		}
		else {
			signInNewSession(username, password, resolve, reject);
		}
	});
};

function handleMedia(redditHandler, post, media) {
	return new Promise(function(resolve, reject) {
		console.log("Media downloaded!");
		console.log(media);

		const hashtags = getRandomHashtags([  "#meme",  "#memesdaily",  "#funnymemes",  "#dailymemes",  "#memestagram",  "#hilariousmemes",  "#spicymemes",  "#bestmemes",  "#funnymeme",  "#internetmemes",  "#dankmeme",  "#comedy",  "#jokes",  "#lmao",  "#memelord",  "#memeculture",  "#mememachine",  "#funnyposts",  "#dankaf",  "#laugh",  "#funnypics",  "#memed",  "#funnymemez",  "#epicmemes",  "#sillymemes",  "#humormemes",  "#offensivememes",  "#funnypic",  "#laughoutloud",  "#memeoftheday",  "#memeislife",  "#lolmemes",  "#jokeoftheday",  "#rofl",  "#laughter",  "#dankhumor",  "#funniestmemes",  "#memeaddict",  "#memes4days",  "#lolz",  "#instalaugh",  "#dankmemez",  "#edgymemes",  "#memesfordays",  "#funnyasf",  "#funnystuff",  "#memestar"], 20);

		if (media['type'] == 'image') {
			console.log("Uploading image to Instagram...");
			igClient.publish.photo({
				file: fs.readFileSync(media['image']),
				caption: post.title + (doCommentCredits ? "" : "\u2063\n\u2063\n" + " " + hashtags.join(" "))
			}).then(function(publishResult) {
				console.log("Image uploaded!");
				if (doCommentCredits) {
					exports.commentCredits(redditHandler, publishResult.media.id, post.author.name, post.id)
						.then(function(commentResponse) {
							console.log("Credits commented");
						})
						.catch(function(err) {
							console.warn("Could not comment credits!");
							console.error(err);
						})
						.finally(function() {
							resolve(publishResult);
						});
				}
				else {
					resolve(publishResult);
				}
			}).catch(function(err) {
				reject(err);
			});
		}
		else if (media['type'] == 'video') {
			console.log("Uploading video to Instagram...");
			igClient.publish.video({
				video: fs.readFileSync(media['video']),
				coverImage: fs.readFileSync(media['thumbnail']),
				caption: post.title + (doCommentCredits ? "" : "\u2063\n\u2063\n" + " " + hashtags.join(" "))
			}).then(function(publishResult) {
				console.log("Video uploaded!");
				if (doCommentCredits) {
					exports.commentCredits(redditHandler, publishResult.media.id, post.author.name, post.id)
						.then(function(commentResponse) {
							console.log("Credits commented");
						})
						.catch(function(err) {
							console.warn("Could not comment credits!");
							console.error(err);
						})
						.finally(function() {
							resolve(publishResult);
						});
				}
				else {
					resolve(publishResult);
				}
			}).catch(function(err) {
				reject(err);
			});
		}
		else {
			reject("Unknown media type!");
		}
	});
}

exports.handleRedditPost = function(redditHandler, post, debugMode) {
    return new Promise(function(resolve, reject) {
        if (!post) {
            return reject(new Error("Invalid post data."));
        }

        console.log("Found a post to handle:");
        console.log('http://www.reddit.com/' + post.permalink);

        // mark post as handled (done)
        redditHandler.getPostStatus().markPostAsDone(post.id);

        // check if post is not a selftext
        if (!post.selftext && post.url.indexOf(post.id) == -1) {
            console.log("Downloading media...");
            mediaDownloader.downloadMedia(redditHandler, post).then(function(media) {
                // Получение случайных хештегов
                
                
                if (!debugMode) {
                    // Добавление случайных хештегов к подписи перед загрузкой на Instagram
                    const caption = post.title + (doCommentCredits ? "" : "\u2063\n\u2063\n" );
                    
                    handleMedia(redditHandler, post, media)
                        .then(function(igPublishResult) {
                            resolve(igPublishResult);
                        })
                        .catch(function(err) {
                            reject(err);
                        })
                        .finally(function() {
                            // temp.clear();
                        });
                } else {
                    console.log("Debug mode is active, so the post does not get uploaded to Instagram right now, nor does the temp folder get cleared.");
                    resolve(null);
                }
            }).catch(function(err) {
                temp.clear();
                reject(err);
            });
        } else {
            reject("Selftext posts are not supported yet.");
        }
    });
};
