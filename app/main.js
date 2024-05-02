const net = require("net");
const fs = require("fs");
const path = require("path");

let DIRECTORY = __dirname;
process.argv.forEach((val, index) => {
  if (val === "--directory" && process.argv[index + 1]) {
    DIRECTORY = process.argv[index + 1];
  }
});

const createHttpResponse = (
  content,
  contentType = "text/plain",
  statusCode = 200
) => {
  const headers = [
    `HTTP/1.1 ${statusCode} ${statusCode === 200 ? "OK" : "NOT FOUND"}`,
    `Content-Type: ${contentType}`,
    `Content-Length: ${Buffer.byteLength(content)}\r\n`,
  ];
  return headers.join("\r\n") + "\r\n" + content;
};

const extractStringPart = (str, delimiter, index) => {
  return str.split(delimiter)[index];
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const lines = data.toString().split("\r\n");
    const [startLine, ...otherLines] = lines;
    const thirdLine = otherLines[1] || "";

    const [method, filePath] = startLine.split(" ");

    if (filePath === "/") {
      socket.write(createHttpResponse("Hello World!"));
    } else if (filePath.startsWith("/echo/")) {
      const echoValue = extractStringPart(filePath, "/", 2);
      socket.write(createHttpResponse(echoValue));
    } else if (filePath === "/user-agent") {
      const userAgent = extractStringPart(thirdLine, " ", 1);
      socket.write(createHttpResponse(userAgent));
    } else if (filePath.startsWith("/files/")) {
      const filename = filePath.split("/")[2];
      const filePathh = path.join(DIRECTORY, filename);

      switch (method) {
        case "GET":
          if (fs.existsSync(filePathh)) {
            const fileContents = fs.readFileSync(filePathh, "utf8");
            socket.write(
              createHttpResponse(fileContents, "application/octet-stream")
            );
          } else {
            socket.write(createHttpResponse("File Not Found", undefined, 404));
          }
          break;
        case "POST":
          const fileContent = otherLines[otherLines.length - 1];
          fs.writeFileSync(filePathh, fileContent);
          socket.write(createHttpResponse("File Created", undefined, 201));
          break;
        default:
          socket.write(
            createHttpResponse("Method Not Allowed", undefined, 405)
          );
      }
    } else {
      socket.write(createHttpResponse("Not Found", undefined, 404));
    }

    socket.end();
  });
});

server.listen(4221, "localhost");
