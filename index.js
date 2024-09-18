const fs = require("fs");
const { setTimeout } = require("node:timers/promises");
const cheerio = require("cheerio");
var _ = require("lodash");

// get html from JPX
let getDelistedCodesHtml = async () => {
  let url = `https://www.jpx.co.jp/listing/stocks/delisted/index.html`;
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
      const current_path = `docs/api/${current_year}.json`;
      if (fs.existsSync(current_path)) {
        let saved_json = fs.readFileSync(current_path);
        try {
          // Update on mismatch
          let saved_obj = JSON.parse(saved_json.toString());
          if (saved_obj.length != tableData.length) {
            fs.writeFileSync(current_path, JSON.stringify(tableData));
          } else {
            if (_.differenceWith(tableData, saved_obj, _.isEqual).length > 0) {
              fs.writeFileSync(current_path, JSON.stringify(tableData));
            }
          }
        } catch (e) {
          fs.writeFileSync(current_path, JSON.stringify(tableData));
        }
      } else {
        fs.writeFileSync(current_path, JSON.stringify(tableData));
      }
    }
  } catch (err) {
    console.log(err);
  }
};

let main = async () => {
  const body = await getDelistedCodesHtml();
  if (body) {
    const tableData = parseDelistedCodesHtml(body);
    updateFile(tableData);
  }
};

main();
