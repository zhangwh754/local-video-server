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
function getVideoMetadata(filePath) {}

module.exports = {
  getVideoFiles,
  getVideoMetadata,
};
