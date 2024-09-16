const fs = require("fs");
const { setTimeout } = require("timers/promises");
const cheerio = require("cheerio");

// get html from JPX
let getDelistedCodesHtml = async (i) => {
  let url = "";
  if (i == 0) {
    url = `https://www.jpx.co.jp/listing/stocks/delisted/index.html`;
  } else {
    url = `https://www.jpx.co.jp/listing/stocks/delisted/archives-0${i}.html`;
  }
  const ret = await fetch(url);

  if (ret.ok) {
    return await ret.text();
  }
  return null;
};

// parse html by cheerio
let parseDelistedCodesHtml = (body) => {
  let tableData = [];
  const $ = cheerio.load(body);
  const table = $("table");
  table.find("tr").each((i, row) => {
    if (i != 0) {
      let d = "";
      let c = "";
      $(row)
        .find("td, th")
        .each((j, cell) => {
          if (j == 0) {
            d = $(cell).text().replace(/\//g, "-");
          }
          if (j == 2) {
            c = $(cell).text();
          }
        });
      tableData.push({ date: d, code: c });
    }
  });
  return tableData;
};

// save data as JSON
let updateFile = (tableData) => {
  const html_year = tableData[0].date.slice(0, 4);
  try {
    const current_year = new Date().getFullYear();
    if (html_year == current_year) {
      fs.writeFileSync(`docs/api/${html_year}.json`, JSON.stringify(tableData));
    }
  } catch (err) {
    console.log(err);
  }
};

let main = async () => {
  for (let i = 0; i < 10; i++) {
    const body = await getDelistedCodesHtml(i);
    if (body) {
      const tableData = parseDelistedCodesHtml(body);
      updateFile(tableData);
    }
    await setTimeout(2000);
  }
};

main();
