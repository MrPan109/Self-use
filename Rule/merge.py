import urllib.request
import os

# 1. 想要合并的远程规则集链接（换成你自己的链接）
URLS = [
    "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Surge-RULE-SET.list",
    "https://raw.githubusercontent.com/MrPan109/Self-use/refs/heads/master/Rule/RNDs.list"
]

def fetch_and_merge():
    merged_lines = set()
    output_lines = []
    
    # 标头注释
    output_lines.append("// ======= 专属自动合并规则集 =======")
    output_lines.append("// 生成时间: 自动更新\n")
    
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

    # 2. 显式指定生成文件的路径为：当前运行目录的根目录下的 AdDIY.list
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "AdDIY.list")

    # 保存为新文件
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"规则合并完成，已生成至路径: {output_path}")

if __name__ == "__main__":
    fetch_and_merge()

