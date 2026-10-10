const fs = require("fs");

const getDelistedCodesHtml = async () => {
  const url = "https://www.jpx.co.jp/listing/stocks/delisted/index.html";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.text();
};

const parseDelistedCodesHtml = (body) => {
  const cheerio = require("cheerio");
  const $ = cheerio.load(body);
  const table = $("table").first();

  const headers = [];
  table.find("tr:first-child th, tr:first-child td").each((_, cell) => {
    headers.push($(cell).text().trim());
  });

  const dateIndex = headers.findIndex((h) => h.includes("上場廃止日"));
  const codeIndex = headers.findIndex((h) => h.includes("コード"));

  if (dateIndex === -1 || codeIndex === -1) {
    throw new Error("Required columns not found in table");
  }

  const tableData = [];
  table.find("tr").each((i, row) => {
    if (i === 0) return;
    const cells = $(row).find("td, th");
    const date = cells.eq(dateIndex).text().trim().replace(/\//g, "-");
    const code = cells.eq(codeIndex).text().trim();
    if (date && code) {
      tableData.push({ date, code });
    }
  });

  return tableData;
};

// 年ごとにデータをグループ化
const groupByYear = (tableData) => {
  return tableData.reduce((acc, item) => {
    const year = item.date.slice(0, 4);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(item);
    return acc;
  }, {});
};

// 単一ファイルの更新（変更があれば true を返す）
const updateYearFile = (year, data) => {
  const currentPath = `docs/api/${year}.json`;
  let shouldWrite = false;

  if (!fs.existsSync(currentPath)) {
    shouldWrite = true;
  } else {
    const savedJson = fs.readFileSync(currentPath, "utf-8");
    try {
      const savedObj = JSON.parse(savedJson);
      if (JSON.stringify(data) !== JSON.stringify(savedObj)) {
        shouldWrite = true;
      }
    } catch (e) {
      console.warn(
        `[${year}] Failed to parse existing JSON, overwriting:`,
        e.message,
      );
      shouldWrite = true;
    }
  }

  if (shouldWrite) {
    fs.mkdirSync("docs/api", { recursive: true });
    fs.writeFileSync(currentPath, JSON.stringify(data, null, 2));
    console.log(`Updated: ${currentPath} (${data.length} records)`);
    return true;
  } else {
    console.log(`No changes: ${currentPath}`);
    return false;
  }
};

const main = async () => {
  const body = await getDelistedCodesHtml();
  const tableData = parseDelistedCodesHtml(body);

  if (tableData.length === 0) {
    console.warn("No data found in HTML");
    return;
  }

  const grouped = groupByYear(tableData);
  let updatedCount = 0;

  for (const [year, data] of Object.entries(grouped)) {
    // 過去11年より古いデータが混入する可能性があるため、必要に応じて年の範囲を制限
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);

    // 現在年から1年先までの範囲に絞る（例: 2026, 2027）
    // 必要に応じて範囲を調整してください
    if (yearNum >= currentYear && yearNum <= currentYear + 1) {
      const updated = updateYearFile(year, data);
      if (updated) updatedCount++;
    } else {
      console.log(`Skipped: ${year}.json (out of target range)`);
    }
  }

  console.log(`Done. ${updatedCount} file(s) updated.`);
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
