const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");

const getData = async (url, customDate) => {
  const res = await axios.get(url, {
    headers: {
      cookie: `cal-custom-range=${customDate} 00:00|${customDate} 23:59; cal-timezone-offset=420; TEServer=TEIIS3;`,
    },
  });
  return res;
};

const scrapData = (data) => {
  const $ = cheerio.load(data);
  const table = $("table#calendar tbody tr[data-url*='/']");

  const res = [];

  table.map((_, el) => {
    const time = $(el)
      .children("td:nth-child(1)")
      .text()
      .replace(/(\r\n|\n|\r)/gm, "")
      .trim();
    const country = $(el)
      .children("td:nth-child(2)")
      .text()
      .replace(/(\r\n|\n|\r)/gm, "")
      .trim();

    const title = $(el)
      .children("td:nth-child(3)")
      .children("a")
      .text()
      .replace(/(\r\n|\n|\r)/gm, "")
      .trim();

    const actual = $(el)
      .children("td:nth-child(4)")
      .text()
      .replace(/(\r\n|\n|\r)/gm, "")
      .trim();

    const previous = $(el)
      .children("td:nth-child(5)")
      .children("#previous")
      .text()
      .replace(/(\r\n|\n|\r)/gm, "")
      .trim();

    const consensus = $(el)
      .children("td:nth-child(6)")
      .text()
      .replace(/(\r\n|\n|\r)/gm, "")
      .trim();

    const forecast = $(el)
      .children("td:nth-child(7)")
      .text()
      .replace(/(\r\n|\n|\r)/gm, "")
      .trim();
    res.push({
      time,
      title,
      metaData: {
        country,
        actual,
        previous,
        consensus,
        forecast,
      },
    });
  });

  return res;
};

const startScrape = async (startDate, endDate) => {
  const year = startDate.split("-")[0];
  const month = startDate.split("-")[1];
  const start = parseInt(startDate.split("-")[2]);
  const end = parseInt(endDate.split("-")[2]);

  const x = end - start;

  for (i = 0; i < x; i++) {
    const date = `${year}-${month}-${start + i}`;
    const { data } = await getData(
      "https://tradingeconomics.com/calendar",
      date
    );

    const result = scrapData(data);
    appendToFile({ [date]: [...result] }, date);
  }
};

const appendToFile = (result, date) => {
  fs.readFile("results.json", function (err, data) {
    const json = JSON.parse(data);
    if (Object.keys(json).length == 0) {
      fs.writeFileSync("results.json", JSON.stringify(result));
    } else {
      json[date] = result[date];
      fs.writeFileSync("results.json", JSON.stringify(json));
    }
  });
  console.log(date + " Success");
};

(async () => {
  startScrape("2022-09-10", "2022-09-16");
})();
