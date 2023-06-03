const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { lookpath } = require('lookpath');
const snoowrap = require('snoowrap');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

let settings = JSON.parse(fs.readFileSync('../settings.json', 'utf8'));

const r = new snoowrap({
  userAgent: settings.reddit.credentials.userAgent,
  clientId: settings.reddit.credentials.clientId,
  clientSecret: settings.reddit.credentials.clientSecret,
  username: settings.reddit.credentials.username,
  password: settings.reddit.credentials.password
});

function createVideoThumb(fromVid, thumbLoc) {
	return new Promise(function(resolve, reject) {
		console.log("Generating thumbnail for video...");
		let thumbCommand = 'ffmpeg -y -ss 00:00:00 -i "' + fromVid + '" -vframes 1 "' + thumbLoc + '"';
		console.log(thumbCommand);
		exec(thumbCommand, function(err, stdout, stderr) {
			if (err) {
				reject(err);
			}

			console.log(`stdout: ${stdout}`);
			console.log(`stderr: ${stderr}`);

			console.log("Thumbnail generated!");
			resolve();
		});
	});
}

function ffmpegInstalled() {
	return new Promise(function(resolve, reject) {
		lookpath("ffmpeg").then(function(path) {
			if (path) {
				resolve(true);
			}
			resolve(false);
		}).catch(function(err) {
			reject(err);
		});
	});
}


exports.downloadImgurGIFV = function(postId, permalink, mediaUrl, tempFolder ) {
  return new Promise(function(resolve, reject) {
    console.log("Imgur GIF detected");

    const gifPath = path.join(tempFolder, postId + ".gif");
    const mp4Path = path.join(tempFolder, postId + ".mp4");
    const thumbPath = path.join(tempFolder, postId + "-thumb.jpg");

    axios({
      url: mediaUrl.replace(".gifv", ".mp4"),  // Imgur stores gifv and mp4 at the same location
      method: 'GET',
      responseType: 'stream'
    }).then(response => {
      const writeStream = fs.createWriteStream(gifPath);
      response.data.pipe(writeStream);
      
      writeStream.on('close', function() {
        console.log("Download complete! Converting GIF to MP4...");

        ffmpeg(gifPath)
          .output(mp4Path)
          .on('end', function() {
            console.log("Conversion done! Creating thumbnail...");

            ffmpeg(mp4Path)
              .screenshot({
                timestamps: ['1%'],
                filename: path.basename(thumbPath),
                folder: tempFolder
              })
              .on('end', function() {
                console.log("Thumbnail created!");

                resolve({
                  type: 'video',
                  video: mp4Path,
                  thumbnail: thumbPath
                });
              })
              .on('error', function(err) {
                console.log("An error occurred while creating thumbnail: " + err.message);
                reject(err);
              });
          })
          .on('error', function(err) {
            console.log("An error occurred while converting GIF to MP4: " + err.message);
            reject(err);
          })
          .run();
      });
    }).catch(function(err) {
      reject(err);
    });
  })
}


exports.downloadImgurMP4 = function(postId, permalink, mediaUrl, tempFolder ) {
	return new Promise(function(resolve, reject) {
		console.log("Imgur MP4 detected");
    let downloadLoc = path.join(tempFolder, postId + "-temp.mp4");
    axios({
        url: mediaUrl,
        responseType: 'stream',
    }).then(response =>
        new Promise((resolveAxios, rejectAxios) => {
            response.data
                .pipe(fs.createWriteStream(downloadLoc))
                .on('finish', () => resolveAxios())
                .on('error', e => rejectAxios(e));
        }),
    ).then(() => {
      let convertLoc = path.join(tempFolder, postId + ".mp4");
      let thumbLoc = path.join(tempFolder, postId + "-thumb.jpg");
      console.log("Download complete! Resizing MP4...");
      let command = `ffmpeg -loglevel verbose -analyzeduration 20M -probesize 20M -y -re -i "${downloadLoc}" -vcodec libx264 -b:v 3500k -vsync passthrough -t 59 -acodec aac -b:a 128k -pix_fmt yuv420p -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white" "${convertLoc}"`;

      exec(command, function(errFfmpeg, stdoutFfmpeg, stderrFfmpeg) {
          if (errFfmpeg) {
              reject(errFfmpeg);
              return;
          }

          createVideoThumb(convertLoc, thumbLoc).then(function() {
              resolve({
                  type: "video", 
                  video: convertLoc,
                  thumbnail: thumbLoc
              });
          })
          .catch(function(err) {
              reject(err);
          });
      });
	  }).catch(function(err) {
			reject(err);
		});
	})
}

exports.downloadGfycatGIFV = function(postId, permalink, mediaUrl, tempFolder) {
  return new Promise(function(resolve, reject) {
    console.log("GfycatGIFV GIF detected");

    const gifPath = path.join(tempFolder, postId + ".gif");
    const mp4Path = path.join(tempFolder, postId + ".mp4");
    const thumbPath = path.join(tempFolder, postId + "-thumb.jpg");

    axios({
      url: mediaUrl.replace(".gifv", ".mp4"),  // Gfycat stores gifv and mp4 at the same location
      method: 'GET',
      responseType: 'stream'
    }).then(response => {
      const writeStream = fs.createWriteStream(gifPath);
      response.data.pipe(writeStream);
      
      writeStream.on('close', function() {
        console.log("Download complete! Converting GIF to MP4...");

        ffmpeg(gifPath)
          .output(mp4Path)
          .on('end', function() {
            console.log("Conversion done! Creating thumbnail...");

            ffmpeg(mp4Path)
              .screenshot({
                timestamps: ['1%'],
                filename: path.basename(thumbPath),
                folder: tempFolder
              })
              .on('end', function() {
                console.log("Thumbnail created!");

                resolve({
                  type: 'video',
                  video: mp4Path,
                  thumbnail: thumbPath
                });
              })
              .on('error', function(err) {
                console.log("An error occurred while creating thumbnail: " + err.message);
                reject(err);
              });
          })
          .on('error', function(err) {
            console.log("An error occurred while converting GIF to MP4: " + err.message);
            reject(err);
          })
          .run();
      });
    }).catch(function(err) {
      reject(err);
    });
  });
}
exports.downloadGfycatMP4 = function(postId, permalink, mediaUrl, tempFolder) {
    return new Promise(function(resolve, reject) {
        console.log("Video on gfycat detected");
        console.log("Media URL is: " + mediaUrl);

        let downloadLoc = path.join(tempFolder, postId + "-temp.mp4");

        const videoId = mediaUrl.match(/http(s|):\/\/gfycat.com\/(.*)$/)[2];

        const url = `https://api.gfycat.com/v1/gfycats/${videoId}`;

        axios
            .get(url)
            .then((response) => {
                const { mp4Url } = response.data.gfyItem;

                axios({
                    url: mp4Url,
                    responseType: "stream",
                })
                    .then((response) =>
                        new Promise((resolveAxios, rejectAxios) => {
                            response.data
                                .pipe(fs.createWriteStream(downloadLoc))
                                .on("finish", () => resolveAxios())
                                .on("error", (e) => rejectAxios(e));
                        })
                    )
                    .then(() => {
                        let convertLoc = path.join(tempFolder, postId + ".mp4");
                        let thumbLoc = path.join(tempFolder, postId + "-thumb.jpg");
                        console.log("Download complete! Resizing MP4...");
                        let command = `ffmpeg -loglevel verbose -analyzeduration 20M -probesize 20M -y -re -i "${downloadLoc}" -vcodec libx264 -b:v 3500k -vsync passthrough -t 59 -acodec aac -b:a 128k -pix_fmt yuv420p -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white" "${convertLoc}"`;

                        exec(command, function (errFfmpeg, stdoutFfmpeg, stderrFfmpeg) {
                            if (errFfmpeg) {
                                reject(errFfmpeg);
                                return;
                            }

                            createVideoThumb(convertLoc, thumbLoc)
                                .then(function () {
                                    resolve({
                                        type: "video",
                                        video: convertLoc,
                                        thumbnail: thumbLoc,
                                    });
                                })
                                .catch(function (err) {
                                    reject(err);
                                });
                        });
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });
};


exports.downloadRedditGIF = function(postId, permalink, mediaUrl, tempFolder) {
  return new Promise(function(resolve, reject) {
    console.log("Reddit GIF detected");

    const gifPath = path.join(tempFolder, postId + ".gif");
    const mp4Path = path.join(tempFolder, postId + ".mp4");
    const thumbPath = path.join(tempFolder, postId + "-thumb.jpg");

    axios({
      url: mediaUrl,
      method: 'GET',
      responseType: 'stream'
    }).then(response => {
      const writeStream = fs.createWriteStream(gifPath);
      response.data.pipe(writeStream);
      
      writeStream.on('close', function() {
        console.log("Download complete! Converting GIF to MP4...");
        
        ffmpeg(gifPath)
          .output(mp4Path)
          .on('end', function() {
            console.log("Conversion done! Creating thumbnail...");

            ffmpeg(mp4Path)
              .screenshot({
                timestamps: ['1%'],
                filename: path.basename(thumbPath),
                folder: tempFolder
              })
              .on('end', function() {
                console.log("Thumbnail created!");

                resolve({
                  type: 'video',
                  video: mp4Path,
                  thumbnail: thumbPath
                });
              })
              .on('error', function(err) {
                console.log("An error occurred while creating thumbnail: " + err.message);
                reject(err);
              });
          })
          .on('error', function(err) {
            console.log("An error occurred while converting GIF to MP4: " + err.message);
            reject(err);
          })
          .run();
      });
    }).catch(function(err) {
      reject(err);
    });
  })
}


exports.downloadVideoReddit = function(postId, permalink, mediaUrl, tempFolder, ) {
  return new Promise(function(resolve, reject) {

      r.getSubmission(postId).fetch().then(submission => {

        if (!submission.media || !submission.media.reddit_video) {
            reject("The submission does not contain a Reddit-hosted video.");
            return;
        }
        const videoUrl = submission.media.reddit_video.fallback_url;

        let downloadLoc = path.join(tempFolder, postId + "-temp.mp4");

        axios({
            url: videoUrl,
            responseType: 'stream',
        }).then(response =>
          new Promise((resolveAxios, rejectAxios) => {
              response.data
                  .pipe(fs.createWriteStream(downloadLoc))
                  .on('finish', () => resolveAxios())
                  .on('error', e => rejectAxios(e));
          }),
        ).then(() => {
            let convertLoc = path.join(tempFolder, postId + ".mp4");
            let thumbLoc = path.join(tempFolder, postId + "-thumb.jpg");
            console.log("Download complete! Resizing MP4...");
            let command = `ffmpeg -loglevel verbose -analyzeduration 20M -probesize 20M -y -re -i "${downloadLoc}" -vcodec libx264 -b:v 3500k -vsync passthrough -t 59 -acodec aac -b:a 128k -pix_fmt yuv420p -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white" "${convertLoc}"`;

            exec(command, function(errFfmpeg, stdoutFfmpeg, stderrFfmpeg) {
                if (errFfmpeg) {
                    reject(errFfmpeg);
                    return;
                }

                createVideoThumb(convertLoc, thumbLoc).then(function() {
                    resolve({
                        type: "video", 
                        video: convertLoc,
                        thumbnail: thumbLoc
                    });
                })
                .catch(function(err) {
                  reject(err);
                });
            });
        }).catch(err => {
          reject(err);
        });
    }).catch(err => {
      reject(err);
    });
  });
};


