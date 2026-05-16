import urllib.request
import os
from datetime import datetime, timedelta, timezone

# 1. 想要合并的远程规则集链接
URLS = [
    "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Surge-RULE-SET.list",
    "https://raw.githubusercontent.com/MrPan109/Self-use/refs/heads/master/Rule/RNDs.list"
]

def fetch_and_merge():
    merged_lines = set()
    output_lines = []
    
    # 利用 timedelta 强制锁定东八区北京时间
    tz_bj = timezone(timedelta(hours=8))
    bj_time = datetime.now(tz_bj).strftime('%Y-%m-%d %H:%M:%S')
    
    # 标头注释
    output_lines.append("// ======= 专属自动合并规则集 =======")
    output_lines.append(f"// 生成时间 (北京时间): {bj_time}\n")
    
    for url in URLS:
        try:
            print(f"正在抓取: {url}")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as response:
                content = response.read().decode('utf-8')
                
                for line in content.splitlines():
                    line = line.strip()
                    # 略过空行和纯注释行
                    if not line or line.startswith("//") or line.startswith("#"):
                        continue
                    
                    # 去重逻辑
                    if line not in merged_lines:
                        merged_lines.add(line)
                        output_lines.append(line)
        except Exception as e:
            print(f"抓取失败 {url}: {e}")

    # 2. 动态获取当前脚本所在目录（即 AutoRule 文件夹），并精准定位 AdDIY.list
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "AdDIY.list")

    # 保存为新文件
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"规则合并完成，已生成至路径: {output_path}")

if __name__ == "__main__":
    fetch_and_merge()
