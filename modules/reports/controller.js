const service = require("./services");

const getReport = async (req, res) => {
  try {
    const report = await service.getCombinedReport();

    return res.json(report);
  } catch (err) {
    console.error("[REPORT ERROR]", err.message);

    return res.status(500).json({
      error: "Failed to generate report",
      detail: err.message,
    });
  }
};

const debugVector = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        error: "Text input is required",
      });
    }

    const result = await service.debugVectorPipeline(text);

    return res.json(result);
  } catch (err) {
    console.error("[VECTOR DEBUG ERROR]", err.message);

    return res.status(500).json({
      error: "Failed to run vector diagnostic",
      detail: err.message,
    });
  }
};

module.exports = {
  getReport,
  debugVector,
};
