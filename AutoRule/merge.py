import urllib.request
import os
from datetime import datetime, timezone, timedelta


# 要合并的远程规则集
URLS = [
    "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Surge-RULE-SET.list",
    "https://raw.githubusercontent.com/MrPan109/Self-use/refs/heads/master/Rule/RNDs.list"
]


def fetch_and_merge():
    merged_lines = set()

    # GitHub Actions 默认 UTC，这里转北京时间
    china_tz = timezone(timedelta(hours=8))
    now = datetime.now(china_tz).strftime("%Y-%m-%d %H:%M:%S")

    for url in URLS:
        try:
            print(f"正在抓取: {url}")

            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0"
                }
            )

            with urllib.request.urlopen(
                req,
                timeout=15
            ) as response:

                # 自动去 BOM
                content = response.read().decode(
                    "utf-8-sig"
                )

                for line in content.splitlines():
                    line = line.strip()

                    # 跳过空行和注释
                    if not line:
                        continue

                    if line.startswith("//"):
                        continue

                    if line.startswith("#"):
                        continue

                    # 去重
                    merged_lines.add(line)

        except Exception as e:
            print(f"抓取失败 {url}: {e}")

    # 统计最终条目数
    total_rules = len(merged_lines)

    # 文件头
    output_lines = [
        "// ======= 专属自动合并规则集 =======",
        f"// 生成时间: {now} (UTC+8)",
        f"// 规则源数量: {len(URLS)}",
        f"// 规则条目总数: {total_rules}",
        ""
    ]

    # 加入规则内容
    output_lines.extend(sorted(merged_lines))

    # 输出文件
    current_dir = os.path.dirname(
        os.path.abspath(__file__)
    )

    output_path = os.path.join(
        current_dir,
        "AdDIY.list"
    )

    with open(
        output_path,
        "w",
        encoding="utf-8",
        newline="\n"
    ) as f:
        f.write("\n".join(output_lines))

    print("规则合并完成")
    print(f"总规则数: {total_rules}")
    print(f"输出路径: {output_path}")


if __name__ == "__main__":
    fetch_and_merge()
