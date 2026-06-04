const axios = require("axios");
const { parseGames, getGameCacheStatus } = require("../games/services");

const normalize = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getMlBaseUrl = () => {
  const mlUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/recommend";

  return mlUrl.replace(/\/recommend\/?$/, "");
};

const countDistribution = (games = [], key) => {
  const counter = new Map();

  games.forEach((game) => {
    const values = Array.isArray(game[key]) ? game[key] : [];

    values.forEach((value) => {
      const normalized = normalize(value);

      if (!normalized) return;

      counter.set(normalized, (counter.get(normalized) || 0) + 1);
    });
  });

  return [...counter.entries()]
    .map(([term, documentFrequency]) => ({
      term,
      documentFrequency,
      percentage:
        games.length > 0
          ? Number(((documentFrequency / games.length) * 100).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.documentFrequency - a.documentFrequency);
};

const getTargetDistribution = (games = []) => {
  const targets = [
    {
      label: "Action",
      key: "action",
      impact:
        "Highly ubiquitous. Receives low IDF weight to prevent broad clumping.",
    },
    {
      label: "Indie",
      key: "indie",
      impact:
        "High frequency. Logarithmic scaling reduces its dominance in recommendations.",
    },
    {
      label: "RPG",
      key: "rpg",
      impact:
        "Moderate frequency. High keyword precision for sub-genre filtering.",
    },
    {
      label: "Strategy",
      key: "strategy",
      impact: "Moderate frequency. Balances structural tags effectively.",
    },
    {
      label: "Niche Tags — Roguelike",
      key: "roguelike",
      impact:
        "Low frequency. Receives maximum IDF weight; drives hyper-specific matches.",
    },
  ];

  return targets.map((target) => {
    const documentFrequency = games.filter((game) => {
      const terms = [
        ...(Array.isArray(game.genreList) ? game.genreList : []),
        ...(Array.isArray(game.categoryList) ? game.categoryList : []),
        ...(Array.isArray(game.tagList) ? game.tagList : []),
      ].map(normalize);

      return terms.includes(target.key);
    }).length;

    return {
      ...target,
      documentFrequency,
      percentage:
        games.length > 0
          ? Number(((documentFrequency / games.length) * 100).toFixed(2))
          : 0,
    };
  });
};

const getUiDatasetReport = async () => {
  const startedAt = performance.now();

  const { games, cached, loadedAt } = await parseGames();

  const finishedAt = performance.now();

  const totalReviews = games.reduce((sum, game) => {
    return sum + toNumber(game.total_reviews);
  }, 0);

  const averageRating =
    games.length > 0
      ? games.reduce((sum, game) => {
          return sum + toNumber(game.rating_percent);
        }, 0) / games.length
      : 0;

  return {
    source: "games_ui.csv",
    totalGames: games.length,
    cached,
    loadedAt,
    ingestionMs: Number((finishedAt - startedAt).toFixed(2)),
    cacheStatus: getGameCacheStatus(),
    totalReviews,
    averageRatingPercent: Number(averageRating.toFixed(2)),
    targetDistribution: getTargetDistribution(games),
    genreDistribution: countDistribution(games, "genreList").slice(0, 20),
    categoryDistribution: countDistribution(games, "categoryList").slice(0, 20),
    tagDistribution: countDistribution(games, "tagList").slice(0, 20),
  };
};

const getMlCorpusReport = async () => {
  const mlBaseUrl = getMlBaseUrl();

  const res = await axios.get(`${mlBaseUrl}/report/corpus`);

  return res.data;
};

const debugVectorPipeline = async (text) => {
  const mlBaseUrl = getMlBaseUrl();

  const res = await axios.post(`${mlBaseUrl}/report/debug`, {
    text,
  });

  return res.data;
};

const getCombinedReport = async () => {
  const [uiDataset, mlCorpus] = await Promise.all([
    getUiDatasetReport(),
    getMlCorpusReport(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    uiDataset,
    mlCorpus,
    telemetry: {
      nodeCache: uiDataset.cacheStatus,
      mlService: {
        status: "ACTIVE",
        source: mlCorpus.source,
        vectorizer: mlCorpus.vectorizer,
      },
    },
  };
};

module.exports = {
  getCombinedReport,
  debugVectorPipeline,
};
