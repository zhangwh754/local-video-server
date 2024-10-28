const fs = require("fs");
const path = require("path");

const express = require("express");
const ip = require("ip");

const app = express();
const PORT = 3000;

// 设置路由来提供视频流
app.get("/video/:filename", (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, `./media/${filename}`); // 将 'your_video.mp4' 替换为你的文件名
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // 设置 `Content-Disposition` 以指定下载文件名
  const downloadFilename = encodeURIComponent(filename); // 编码以确保文件名安全

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${downloadFilename}"`,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${downloadFilename}"`,
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// 启动服务器
app.listen(PORT, () => {
  const localIp = ip.address(); // 获取本地局域网IP地址
  console.log(`Server running at http://${localIp}:${PORT}/video`);
});
