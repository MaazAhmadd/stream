// express app boiler plate
const fs = require("fs");
const RangeParser = require("range-parser");
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const path = require("path");
// This function reads the video file from disk and returns a streamable response
function streamVideo(req, res, videoPath) {
  const videoSize = fs.statSync(videoPath).size;
  const range = req.headers.range;
  if (range) {
    // Parse the range header to get the start and end bytes
    const positions = RangeParser(videoSize, range);
    // Set the response headers to stream partial content
    res.status(206).header({
      "Content-Type": "video/mp4",
      "Content-Length": positions[0].end - positions[0].start + 1,
      "Content-Range": `bytes ${positions[0].start}-${positions[0].end}/${videoSize}`,
      "Accept-Ranges": "bytes",
    });
    // Create a stream of the specified bytes and pipe it to the response
    const stream = fs.createReadStream(videoPath, {
      start: positions[0].start,
      end: positions[0].end,
    });
    return stream.pipe(res);
  } else {
    // If no range header is provided, stream the entire video
    res.header({
      "Content-Type": "video/mp4",
      "Content-Length": videoSize,
      "Accept-Ranges": "bytes",
    });
    const stream = fs.createReadStream(videoPath);
    return stream.pipe(res);
  }
}

app.get("/stream", (req, res) => {
  streamVideo(req, res, path.resolve(__dirname, "video.mp4"));
});

app.get("*", (req, res) => {
  res.status(404).send({ message: "Not Found" });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
