#!/bin/bash
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod +x yt-dlp
mkdir -p .vercel/bin
mv yt-dlp .vercel/bin/ 