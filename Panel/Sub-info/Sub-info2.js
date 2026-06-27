/*
 * Surge 流量面板增强版
 * 每月重置机场专用
 * 2026.06.27（优化版V1.2）
 */

// 全局入口流控：严格遵守 Surge 的异步生命周期规范，确保请求完成后才释放线程
main()
  .then((result) => {
    $done(result);
  })
  .catch((err) => {
    console.log("脚本执行异常: " + err);
    $done();
  });

async function main() {
  let args = getArgs();

  // 将 args 挂载到全局或直接传递，确保 getUserInfo 内部能正确读取
  let info = await getDataInfo(args);
  if (!info) return null;

  let resetDayLeft = getRmainingDays(parseInt(args["reset_day"]));

  let used = info.download + info.upload;
  let total = info.total;
  let expire = args.expire || info.expire;

  // 已用百分比
  let usedPercent = total > 0 ? ((used / total) * 100).toFixed(1) : "0.0";

  // 第一行内容
  let content = [
    `用量：${bytesToSize(used)} / ${bytesToSize(total)} (${usedPercent}%)`
  ];

  // 第二行内容
  let secondLine = [];

  if (resetDayLeft) {
    secondLine.push(`重置：${resetDayLeft}天`);
  }

  if (expire && expire !== "false") {
    if (/^[\d.]+$/.test(expire)) {
      expire *= 1000;
    }
    secondLine.push(`到期：${formatTime(expire)}`);
  }

  if (secondLine.length > 0) {
    content.push(secondLine.join(" ｜ "));
  }

  // 当前时间
  let now = new Date();
  let hour = String(now.getHours()).padStart(2, "0");
  let minutes = String(now.getMinutes()).padStart(2, "0");

  return {
    title: `${args.title} ｜ ${hour}:${minutes}`,
    content: content.join("\n"),
    icon: args.icon || "airplane.circle",
    "icon-color": args.color || "#007aff",
  };
}

function getArgs() {
  if (typeof $argument === "undefined" || !$argument) return {};
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(args) {
  let method = args.method || "get";

  let request = {
    headers: {
      "User-Agent": "clash.meta",
      "Accept": "*/*",
      "X-Fetch-User-Info": "1"
    },
    url: args.url
  };

  return new Promise((resolve, reject) => {
    // 显式指定请求方法，规避动态调用可能产生的上下文丢失
    let httpClientMethod = method.toLowerCase() === "head" ? "head" : "get";
    
    $httpClient[httpClientMethod](request, (err, resp, body) => {
      if (err != null) {
        reject(`网络请求错误: ${err}`);
        return;
      }

      if (resp.status !== 200) {
        reject(`服务器返回错误状态码: ${resp.status}`);
        return;
      }

      // 兼容部分旧版环境使用 resp.body，新版环境优先使用标准回调参数 body
      let responseBody = body || resp.body;

      // 优先从响应头获取
      let header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );

      if (header && resp.headers[header]) {
        resolve({ type: "header", data: resp.headers[header] });
        return;
      }

      if (responseBody) {
        resolve({ type: "body", data: responseBody });
        return;
      }

      reject("链接响应头和正文均为空");
    });
  });
}

async function getDataInfo(args) {
  if (!args.url) {
    console.log("未检测到传入的 url 参数");
    return null;
  }

  const [err, result] = await getUserInfo(args)
    .then((res) => [null, res])
    .catch((err) => [err, null]);

  if (err) {
    console.log(err);
    return null;
  }

  let rawStr = result.data;

  if (result.type === "body") {
    // Base64 自动判定解码
    try {
      if (!/^[A-Za-z0-9+/=\s]+$/.test(rawStr)) throw new Error("Not base64");
      if (typeof $utils !== "undefined" && $utils.base64Decode) {
        rawStr = $utils.base64Decode(rawStr);
      } else {
        rawStr = atob(rawStr.replace(/[\s\r\n]+/g, ""));
      }
    } catch (e) {
      // 说明是明文 YAML
    }

    try { rawStr = decodeURIComponent(rawStr); } catch(e) {}

    // 强力匹配文本节点名或注释中的流量关键字
    let totalMatch = rawStr.match(/total[=:][\s"']?([\d.eE+-]+)/i);
    let downloadMatch = rawStr.match(/download[=:][\s"']?([\d.eE+-]+)/i);
    let uploadMatch = rawStr.match(/upload[=:][\s"']?([\d.eE+-]+)/i);
    let expireMatch = rawStr.match(/expire[=:][\s"']?([\d.eE+-]+)/i);

    if (totalMatch) {
      return {
        total: Number(totalMatch[1]),
        download: downloadMatch ? Number(downloadMatch[1]) : 0,
        upload: uploadMatch ? Number(uploadMatch[1]) : 0,
        expire: expireMatch ? Number(expireMatch[1]) : null
      };
    }
  }

  // 兜底：按标准 KV 格式解析
  try {
    let info = Object.fromEntries(
      rawStr
        .match(/\w+=[\d.eE+-]+/g)
        .map((item) => item.split("="))
        .map(([k, v]) => [k, Number(v)])
    );
    return {
      download: info.download || 0,
      upload: info.upload || 0,
      total: info.total || 0,
      expire: info.expire || null
    };
  } catch (e) {
    console.log("解析流量失败，文本片段: " + rawStr.slice(0, 200));
    return null;
  }
}

function getRmainingDays(resetDay) {
  if (!resetDay) return null;

  let now = new Date();
  let today = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();

  let daysInMonth;

  if (resetDay > today) {
    daysInMonth = 0;
  } else {
    daysInMonth = new Date(year, month + 1, 0).getDate();
  }

  return daysInMonth - today + resetDay;
}

function bytesToSize(bytes) {
  if (bytes <= 0) return "0 B";
  let k = 1024;
  let sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = String(dateObj.getMonth() + 1).padStart(2, "0");
  let day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}
