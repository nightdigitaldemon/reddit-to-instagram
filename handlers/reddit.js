const snoowrap = require('snoowrap');

let subreddit = null;
let debugP = null;
let postStatus = null;

let settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

const r = new snoowrap({
  userAgent: settings.reddit.credentials.userAgent,
  clientId: settings.reddit.credentials.clientId,
  clientSecret: settings.reddit.credentials.clientSecret,
  username: settings.reddit.credentials.username,
  password: settings.reddit.credentials.password
});

exports.setPostStatus = function(newPostStatus) {
	postStatus = newPostStatus;
};

exports.getPostStatus = function() {
	return postStatus;
};

exports.setSubreddit = function(sub) {
	subreddit = r.getSubreddit(sub);
};

exports.getSubreddit = function() {
	return subreddit.display_name;
};

exports.setPostToDebug = function(postId) {
	debugP = postId;
};

exports.getPostToDebug = function() {
	return debugP;
};

exports.retrieveRedditPosts = async function(amount) {
	try {
		const posts = await subreddit.getHot({ limit: amount });
		console.log('Posts are:', posts);
		return posts;
	} catch(err) {
		console.error(err);
		throw err;
	}
};

exports.getPostFromPermalink = async function(permalink) {
	try {
		const post = await r.getSubmission(permalink);
		console.log("Reddit post fetched:", post);
		return post;
	} catch(err) {
		console.error(err);
		throw err;
	}
};

exports.getPostToDo = async function() {
	try {
		if (debugP != null) {
			const post = await r.getSubmission(debugP);
			console.log("[DEBUGGING MODE] Reddit post fetched:", post);
			return post;
		} else {
			const posts = await exports.retrieveRedditPosts(80);
			let postToDo = null;

			for (const post of posts) {
				if (postStatus.postNotDone(post.id) && !post.over_18 && !post.stickied) {
					postToDo = post;
					break;
				}
			}

			if (postToDo && postStatus.postNotDone(postToDo.id)) {
				console.log('Post is:', postToDo);
				return postToDo;
			} else {
				throw new Error("No post to upload to Instagram left (all posts are done)");
			}
		}
	} catch(err) {
		console.error(err);
		throw err;
	}
};
