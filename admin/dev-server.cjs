const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 5173);
const host = "127.0.0.1";
const root = path.resolve(__dirname, "..");

const contentTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".md": "text/plain",
};

http.createServer((request, response) => {
    const url = new URL(request.url, `http://${host}:${port}`);
    let filePath = decodeURIComponent(url.pathname);

    if (filePath === "/") {
        filePath = "/index.html";
    }

    const absolutePath = path.normalize(path.join(root, filePath));

    if (!absolutePath.startsWith(root)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(absolutePath, (error, data) => {
        if (error) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        response.writeHead(200, {
            "Content-Type": contentTypes[path.extname(absolutePath)] || "application/octet-stream",
        });
        response.end(data);
    });
}).listen(port, host);
