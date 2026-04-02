# -*- coding: utf-8 -*-
import efinance as ef
import pandas as pd
import os
from pathlib import Path
import json
from datetime import datetime

"""
使用方法:
python scripts/fetch.py
然后根据提示输入即可，支持回车使用默认值。
此脚本仅将数据写入 public/data 目录，以便 Next.js 访问。
"""

def get_input(prompt, default_value):
    # If run in non-interactive environment, use default
    try:
        user_input = input(f"{prompt} (默认: {default_value}): ").strip()
        return user_input if user_input else default_value
    except EOFError:
        return default_value

def update_index(data_path):
    """通过读取目录下的所有 JSON 文件来重新生成 index.json"""
    if not data_path.exists():
        return
        
    valid_items = []
    # 遍历目录下所有的 .json 文件 (排除 index.json 自己)
    for json_file in data_path.glob("*.json"):
        if json_file.name == "index.json":
            continue
            
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                content = json.load(f)
                if "metadata" in content:
                    meta = content["metadata"]
                    valid_items.append({
                        "name": meta.get("name", "Unknown"),
                        "code": meta.get("code", "Unknown"),
                        "fileName": json_file.name
                    })
        except Exception as e:
            print(f"警告: 无法读取文件 {json_file.name}: {e}")
    
    # 按照名称排序
    valid_items.sort(key=lambda x: x['name'])
    
    # 写入最新的 index.json
    index_path = data_path / "index.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(valid_items, f, ensure_ascii=False, indent=2)

def fetch_data(stock_code, beg_date="20000101", end_date=None):
    if not end_date:
        end_date = datetime.now().strftime("%Y%m%d")
        
    print(f"\n正在获取 {stock_code} 从 {beg_date} 到 {end_date} 的数据...")

    try:
        # 默认使用前复权 (fqt=1) 和 日线 (klt=101)
        df = ef.stock.get_quote_history(stock_code, beg=beg_date, end=end_date, klt=101, fqt=1)
        if df.empty:
            print("❌ 未获取到数据，请检查代码或日期范围。")
            return
    except Exception as e:
        print(f"❌ 获取失败: {e}")
        return

    # 提取基本信息
    stock_name = df['股票名称'].iloc[0].strip().replace(' ', '')
    actual_code = df['股票代码'].iloc[0]

    # 清洗数据
    clean_df = pd.DataFrame()
    clean_df['time'] = df['日期']
    clean_df['open'] = df['开盘']
    clean_df['close'] = df['收盘']
    clean_df['high'] = df['最高']
    clean_df['low'] = df['最低']
    clean_df['volume'] = df['成交量']
    clean_df['change_pct'] = df['涨跌幅']
    
    # 强制时间排序并去重
    clean_df['time'] = pd.to_datetime(clean_df['time'])
    clean_df = clean_df.sort_values('time').drop_duplicates('time')
    clean_df['time'] = clean_df['time'].dt.strftime('%Y-%m-%d')
    
    # 计算累计收益作为基准 (Normalized to 0%)
    first_close = clean_df['close'].iloc[0]
    clean_df['benchmark'] = ((clean_df['close'] / first_close) - 1) * 100
    
    # 文件名：股票名_代码.json
    filename = f"{stock_name}_{actual_code}.json"
    
    result = {
        "metadata": {
            "name": stock_name,
            "code": actual_code,
            "count": len(clean_df),
            "period": f"{beg_date}-{end_date}"
        },
        "data": clean_df.to_dict(orient='records')
    }

    # 仅向 public/data 保存数据，减少冗余
    dest_path = Path("public/data")
    dest_path.mkdir(parents=True, exist_ok=True)
    
    file_path = dest_path / filename
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    # 更新 index.json
    update_index(dest_path)
    
    print(f"\n✅ 成功！数据已更新至:")
    print(f"   - public/data/{filename}")
    print(f"   - public/data/index.json 已更新 (自动排序)")
    print(f"   共 {len(clean_df)} 条记录。\n")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # Non-interactive mode
        fetch_data(sys.argv[1])
    else:
        # Guided mode
        print("\n--- 股票数据抓取工具 ---")
        stock_code = input("请输入股票代码或名称 (如 600519): ").strip()
        if not stock_code:
            print("未输入代码，程序退出。")
            sys.exit(0)
        fetch_data(stock_code)
