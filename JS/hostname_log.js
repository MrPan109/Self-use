// log-requests.js

// 记录请求信息的函数
function logRequest(request) {
    const logEntry = `Time: ${new Date().toISOString()}, Hostname: ${request.hostname}, URL: ${request.url}`;
    
    // 将日志条目输出到控制台
    console.log(logEntry);
}

// 调用记录请求信息的函数
logRequest($request);

// 返回 matched: true，表示这个脚本用于日志记录，匹配任何规则，如果不需要匹配可以改为false
$done({ matched: true });