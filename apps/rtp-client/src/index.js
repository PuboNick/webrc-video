const path = require('path');
const fs = require('fs');

const { createRTPClient } = require('./rtp-client');
const { videos } = require('./config');

// local 当前主机ip，remote 远程服务器ip port 当前通道监听端口
const options = {
  server: 'ws://127.0.0.1:8080/rtp',
  local: '127.0.0.1',
  remote: '127.0.0.1',
};

const createFolder = async () => {
  const folder = path.resolve(`cache/recorder`);
  for (const item of videos) {
    fs.mkdirSync(`${folder}/${item.id}`, { recursive: true });
  }
};

createFolder();

videos.forEach((video) => {
  // 按每小时
  const output = `-f segment -segment_time 3600 -reset_timestamps 1 -strftime 1 ./cache/recorder/${video.id}/%Y%m%d%H%M%S.mp4`;
  createRTPClient({ ...video, ...options, output });
});

process.on('uncaughtException', (err) => console.log(err));
process.on('unhandledRejection', (err) => console.log(err));
