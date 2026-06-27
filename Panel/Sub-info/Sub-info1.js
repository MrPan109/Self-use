/*
 * 由@mieqq编写
 * 原脚本地址：https://raw.githubusercontent.com/mieqq/mieqq/master/sub_info_panel.js
 * 由@mrpan109修改
 * 百分比显示优化版
 * 适用于：总流量套餐 / 不按月重置机场
 * 2026.06.27（优化版V1.2）
 */

let args = getArgs();

(async () => {
  let info = await getDataInfo(args.url);
  if (!info) $done();

  let used = info.download + info.upload;
  let total = info.total;

  // 已用百分比
  let usedPercent =
    total > 0 ? ((used / total) * 100).toFixed(1) : "0.0";

  let expire = args.expire || info.expire;

  // 内容显示
  let content = [
    `用量：${bytesToSize(used)} / ${bytesToSize(total)} (${usedPercent}%)`
  ];

  // 到期时间
  if (expire && expire !== "false") {
    if (/^[\d.]+$/.test(expire)) expire *= 1000;
    content.push(`到期：${formatTime(expire)}`);
  }

  // 当前时间
  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();

  hour = hour > 9 ? hour : "0" + hour;
  minutes = minutes > 9 ? minutes : "0" + minutes;

  $done({
    title: `${args.title} | ${hour}:${minutes}`,
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
      // 核心修改：精准伪装成 clash.meta (Mihomo) 客户端 UA
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

      // 1. 优先尝试从响应头获取
      let header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );

      if (header && resp.headers[header]) {
        resolve({ type: "header", data: resp.headers[header] });
        return;
      }

      // 2. 核心抢救：处理返回的正文
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
    return;
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
      // 解码失败说明本来就是明文（如 YAML），保持原样
    }

    try { rawStr = decodeURIComponent(rawStr); } catch(e) {}

    // 从返回的正文（包含伪装流量节点）中疯狂搜刮类似 total=, download=, upload= 的关键字
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

  // 兜底逻辑：处理标准 HTTP Header 或者正文纯文本符合标准 KV 格式的数据
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
    console.log("解析流量数据失败，抓取到的文本前300个字符为:\n" + rawStr.slice(0, 300));
    return null;
  }
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0 B";
  let k = 1024;
  let sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  return `${year}年${month}月${day}日`;
}
