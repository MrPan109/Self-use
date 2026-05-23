/*
 * 由@mieqq编写
 * 原脚本地址：https://raw.githubusercontent.com/mieqq/mieqq/master/sub_info_panel.js
 * 由@mrpan109修改
 * 百分比显示优化版
 * 适用于：总流量套餐 / 不按月重置机场
 * 2026.05.23
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
  let method = args.method || "head";

  let request = {
    headers: {
      "User-Agent": "Quantumult%20X"
    },
    url
  };

  return new Promise((resolve, reject) =>
    $httpClient[method](request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }

      if (resp.status !== 200) {
        reject(resp.status);
        return;
      }

      let header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );

      if (header) {
        resolve(resp.headers[header]);
        return;
      }

      reject("链接响应头不带有流量信息");
    })
  );
}

async function getDataInfo(url) {
  const [err, data] = await getUserInfo(url)
    .then((data) => [null, data])
    .catch((err) => [err, null]);

  if (err) {
    console.log(err);
    return;
  }

  return Object.fromEntries(
    data
      .match(/\w+=[\d.eE+-]+/g)
      .map((item) => item.split("="))
      .map(([k, v]) => [k, Number(v)])
  );
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