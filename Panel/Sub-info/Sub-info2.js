/*
 * Surge 流量面板增强版
 * 每月重置机场专用
 * 2026.06.27（优化版V1.0）
 */

(async () => {
  let args = getArgs();

  let info = await getDataInfo(args.url);
  if (!info) $done();

  let resetDayLeft = getRmainingDays(
    parseInt(args["reset_day"])
  );

  let used = info.download + info.upload;
  let total = info.total;

  let expire = args.expire || info.expire;

  // 已用百分比
  let usedPercent =
    total > 0
      ? ((used / total) * 100).toFixed(1)
      : "0.0";

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

  $done({
    title: `${args.title} ｜ ${hour}:${minutes}`,
    content: content.join("\n"),
    icon: args.icon || "airplane.circle",
    "icon-color": args.color || "#007aff",
  });
})();

function getArgs() {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let method = args.method || "get";

  let request = {
    headers: {
      // 优化1：伪装成 clash.meta 确保下发包含 VLESS 协议的完整节点和流量信息
      "User-Agent": "clash.meta",
      "Accept": "*/*"
    },
    url
  };

  return new Promise((resolve, reject) =>
    $httpClient[method.toLowerCase()](request, (err, resp) => {
      if (err != null) {
        reject(`网络请求错误: ${err}`);
        return;
      }

      if (resp.status !== 200) {
        reject(`服务器返回错误状态码: ${resp.status}`);
        return;
      }

      // 优先从响应头获取
      let header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );

      if (header && resp.headers[header]) {
        resolve({ type: "header", data: resp.headers[header] });
        return;
      }

      // 响应头没有，则托管正文交给下一步兜底解密
      if (resp.body) {
        resolve({ type: "body", data: resp.body });
        return;
      }

      reject("链接响应头和正文均为空");
    })
  );
}

async function getDataInfo(url) {
  const [err, result] = await getUserInfo(url)
    .then((res) => [null, res])
    .catch((err) => [err, null]);

  if (err) {
    console.log(err);
    return null;
  }

  let rawStr = result.data;

  if (result.type === "body") {
    // 自动判定并处理 Base64 解码
    try {
      if (!/^[A-Za-z0-9+/=\s]+$/.test(rawStr)) throw new Error("Not base64");
      if (typeof $utils !== "undefined" && $utils.base64Decode) {
        rawStr = $utils.base64Decode(rawStr);
      } else {
        rawStr = atob(rawStr.replace(/[\s\r\n]+/g, ""));
      }
    } catch (e) {
      // 解码失败说明是明文 YAML
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
  if (!resetDay) return;

  let now = new Date();
  let today = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();

  let daysInMonth;

  if (resetDay > today) {
    daysInMonth = 0;
  } else {
    // 自动获取当前月总天数
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
