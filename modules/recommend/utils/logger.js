const fs = require("fs");
const path = require("path");

const saveLogs = (data) => {
  fs.writeFileSync(
    path.join(
      __dirname,
      "../../../../research/preprocessing/evaluation/logs.json",
    ),
    JSON.stringify(data, null, 2),
  );
};

module.exports = {
  saveLogs,
};
