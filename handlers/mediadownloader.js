const videoHandler = require("./video.js");
const imageHandler = require("./image.js");
const temp = require("./temp.js");

exports.downloadMedia = function(redditHandler, post, handlePost) {
	return new Promise(function(resolve, reject) {
		let mediaUrl = post.url;
		console.log("Initial mediaUrl: ", mediaUrl);

		if (mediaUrl.match(/http(s|):\/\/www.reddit.com\/r\/.*$/) != null) {
			console.log("Crosspost detected! Fetching post...");
			redditHandler.getPostFromPermalink(mediaUrl).then(handlePost).catch(function(err) {
				console.log("An error occurred: could not handle crosspost");
				console.error(err);
			});
			return;
		}

		if (mediaUrl.match(/http(s|):\/\/i.imgur.com\/.*.gifv$/) != null) {
			console.log("GIFV on Imgur detected");
			videoHandler.downloadImgurGIFV(post.id, post.permalink, mediaUrl, temp.getTempDir()).then(function(res) {
				resolve({
					type: 'video',
					video: res['video'],
					thumbnail: res['thumbnail']
				});
			});
		}
		else if (mediaUrl.match(/http(s|):\/\/gfycat.com\/.*.gifv$/) != null) {
			console.log("GIFV on gfycat detected");
			videoHandler.downloadGfycatGIFV(post.id, post.permalink, mediaUrl, temp.getTempDir()).then(function(res) {
				resolve({
					type: 'video',
					video: res['video'],
					thumbnail: res['thumbnail']
				});
			});
		}
		else if (mediaUrl.match(/http(s|):\/\/gfycat.com\/.*.mp4/) != null) {
			console.log("Video on gfycat detected");
			videoHandler.downloadGfycatMP4(post.id, post.permalink, mediaUrl, temp.getTempDir()).then(function(res) {
				resolve({
					type: 'video',
					video: res['video'],
					thumbnail: res['thumbnail']
				});
			});
		}
		else if (mediaUrl.match(/http(s|):\/\/v.redd.it\/.*$/) != null) {
			console.log("Video on Reditt detected");
			videoHandler.downloadVideoReddit(post.id, post.permalink, mediaUrl, temp.getTempDir()).then(function(res) {
				resolve({
					type: 'video',
					video: res['video'],
					thumbnail: res['thumbnail']
				});
			});
		}
		else {
			console.log("Normal image detected");
			imageHandler.downloadImage(post.id, post.permalink, mediaUrl, temp.getTempDir()).then(function(res) {
				resolve(res);
			}).catch(function(err) {
				reject(err);
			});
		}
	});
};

