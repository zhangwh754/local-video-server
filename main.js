const fs = require("fs");
const path = require("path");

const express = require("express");
const ip = require("ip");
const { getVideoFiles, getVideoMetadata } = require("./utils/getVideoInfo");

const app = express();
const PORT = 3000;

// 获取视频文件列表接口
app.get("/", (req, res) => {
  const videoFiles = getVideoFiles(path.join(__dirname, "./media"));

  // 读取模板文件并插入视频列表
  fs.readFile(
    path.join(__dirname, "./index.html"),
    "utf8",
    async (err, htmlData) => {
      if (err) {
        console.error("Error reading template file:", err);
        return res.status(500).send("Error loading page.");
      }

      let videoItems = "";

      // 生成视频列表的 HTML 项目
      for (let i = 0; i < videoFiles.length; i++) {
        const video = videoFiles[i];

        const filename = video.split("\\").pop();
        const metadata = await getVideoMetadata(video);

        const str = `
          <div class="video-item">
            <a target="_blank" href="/video/${filename}"">
              <div class="video-card">
                <img src="/image/${metadata.thumbnail}" class="video-thumbnail" />
                <div class="video-info">
                  <div class="video-title">${filename}</div>
                  <div class="video-duration">Duration: ${metadata.duration}</div>
                </div>
              </div>
            </a>
          </div>
        `;

        videoItems = videoItems.concat(str);
      }

      // 将 {{VIDEO_LIST}} 替换为动态生成的内容
      const videoListPage = htmlData.replace(
        "<!-- {{VIDEO_LIST}} -->",
        videoItems
      );

      // 发送修改后的 HTML 内容
      res.send(videoListPage);
    }
  );
});

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
      // "Content-Disposition": `attachment; filename="${downloadFilename}"`,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      // "Content-Disposition": `attachment; filename="${downloadFilename}"`,
    };

    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// 设置路由来提供视频流
app.get("/image/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, `./media/${filename}`);

  fs.createReadStream(imagePath).pipe(res);
});

// 启动服务器
app.listen(PORT, () => {
  const localIp = ip.address(); // 获取本地局域网IP地址
  console.log(`Server running at http://${localIp}:${PORT}`);
});
