/*
 * Surge 流量面板增强版
 * 每月重置机场专用
 * 2026.05.23
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

  // 第一行
  let content = [
    `用量：${bytesToSize(used)} / ${bytesToSize(total)} (${usedPercent}%)`
  ];

  // 第二行
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
  let request = {
    headers: {
      "User-Agent": "Quantumult%20X"
    },
    url
  };

  return new Promise((resolve, reject) =>
    $httpClient.get(request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }

      if (resp.status !== 200) {
        reject(resp.status);
        return;
      }

      let header = Object.keys(resp.headers).find(
        (key) =>
          key.toLowerCase() ===
          "subscription-userinfo"
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
    daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();
  }

  return daysInMonth - today + resetDay;
}

function bytesToSize(bytes) {
  if (bytes <= 0) return "0 B";

  let k = 1024;

  let sizes = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB"
  ];

  let i = Math.floor(
    Math.log(bytes) / Math.log(k)
  );

  return (
    (bytes / Math.pow(k, i)).toFixed(2) +
    " " +
    sizes[i]
  );
}

function formatTime(time) {
  let dateObj = new Date(time);

  let year = dateObj.getFullYear();
  let month = String(
    dateObj.getMonth() + 1
  ).padStart(2, "0");
  let day = String(
    dateObj.getDate()
  ).padStart(2, "0");

  return `${year}.${month}.${day}`;
}