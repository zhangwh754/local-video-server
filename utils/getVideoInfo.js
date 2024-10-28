const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const videoDirectory = path.join(__dirname, "../media");

// 递归获取所有视频文件及其路径
function getVideoFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getVideoFiles(filePath, fileList);
    } else if (file.endsWith(".mp4")) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// 获取视频封面和时长
async function getVideoMetadata(filePath) {
  const [images, duration] = await Promise.all([
    getVideoImage(filePath),
    getVideoDuration(filePath),
  ]);

  return { ...images, ...duration };
}

function getVideoImage(filePath) {
  return new Promise((resolve, reject) => {
    const videoDir = path.dirname(filePath);
    const videoName = path.basename(filePath, path.extname(filePath));
    const thumbnailPath = path.join(videoDir, `${videoName}.jpg`);

    console.log(
      `ffmpeg -i "${filePath}" -ss 00:00:01.000 -vframes 1 "${thumbnailPath}"`
    );

    // 检查是否已存在同名的缩略图文件
    if (fs.existsSync(thumbnailPath)) {
      // 如果缩略图存在，直接返回封面路径和视频时长
      resolve({
        path: filePath,
        thumbnail: `${videoName}.jpg`,
      });
    } else {
      // 如果缩略图不存在，生成缩略图并获取时长
      exec(
        `ffmpeg -i "${filePath}" -ss 00:00:01.000 -vframes 1 "${thumbnailPath}"`,
        (error) => {
          if (error) {
            return reject(`Error creating thumbnail: ${error.message}`);
          }

          resolve({
            path: filePath,
            thumbnail: `${videoName}.jpg`,
          });
        }
      );
    }
  });
}

function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    exec(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      (error, data) => {
        if (error) {
          return reject(`Error creating thumbnail: ${error.message}`);
        }

        resolve({
          duration: convertSecondsToHMS(data),
        });
      }
    );
  });
}

function convertSecondsToHMS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const secondsRemaining = Math.floor(seconds - hours * 3600 - minutes * 60);

  // 使用padStart确保每个部分都是两位数
  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = secondsRemaining.toString().padStart(2, "0");

  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

module.exports = {
  getVideoFiles,
  getVideoMetadata,
};
