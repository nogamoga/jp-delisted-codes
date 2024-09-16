# jp-delisted-codes
- 東証(JPX)の指定された西暦の上場廃止銘柄の上場廃止日と証券コードをJSONで返します
- 取得可能なデータは2015年までです

## API仕様
- **GET**：https://nogamoga.github.io/jp-delisted-codes/api/**{西暦}**.json

## レスポンス
```json
[
  {
    "date": "2024-09-27",
    "code": "2468"
  },
  {
    "date": "2024-09-27",
    "code": "2899"
  },
  {
    ～省略～
  } 
]
```

## 元データ
[上場廃止銘柄一覧 - 日本取引所グループ](https://www.jpx.co.jp/listing/stocks/delisted/index.html)
