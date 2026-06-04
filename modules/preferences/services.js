const User = require("../../models/user");
const { parseGames } = require("../games/services");
const { toGameCard } = require("../games/serializers");

const WEIGHT_VALUE = {
  dislike: -1,
  normal: 1,
  love: 2,
};

const normalizeWeight = (weight) => {
  if (["dislike", "normal", "love"].includes(weight)) {
    return weight;
  }

  return "normal";
};

const toNumber = (value) => {
  const num = Number(value);

  return Number.isFinite(num) ? num : 0;
};

const normalizeTerm = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const addToVector = (vector, term, value) => {
  const normalized = normalizeTerm(term);

  if (!normalized) return;

  vector.set(normalized, (vector.get(normalized) || 0) + value);
};

const getPreferenceWeight = (user, appid) => {
  const rawWeights = user.preferenceWeights || {};

  if (typeof rawWeights.get === "function") {
    return normalizeWeight(rawWeights.get(String(appid)));
  }

  return normalizeWeight(rawWeights[String(appid)]);
};

const getSeedWeightValue = (weight) => {
  return WEIGHT_VALUE[normalizeWeight(weight)] || 1;
};

const getGameTerms = (game) => {
  const terms = [];

  (game.genreList || []).forEach((term) => {
    terms.push({ term, baseWeight: 3 });
  });

  (game.tagList || []).forEach((term) => {
    terms.push({ term, baseWeight: 2 });
  });

  (game.categoryList || []).forEach((term) => {
    terms.push({ term, baseWeight: 1.5 });
  });

  return terms;
};

let cachedIdf = null;

const buildIdfIndex = (games = []) => {
  if (cachedIdf) return cachedIdf;

  const documentFrequency = new Map();
  const totalGames = games.length;

  games.forEach((game) => {
    const uniqueTerms = new Set();

    getGameTerms(game).forEach(({ term }) => {
      const normalized = normalizeTerm(term);

      if (normalized) {
        uniqueTerms.add(normalized);
      }
    });

    uniqueTerms.forEach((term) => {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    });
  });

  const idf = new Map();

  documentFrequency.forEach((df, term) => {
    const score = Math.log((totalGames + 1) / (df + 1)) + 1;

    idf.set(term, score);
  });

  cachedIdf = idf;

  return cachedIdf;
};

const buildGameVector = (game, idf) => {
  const vector = new Map();

  getGameTerms(game).forEach(({ term, baseWeight }) => {
    const normalized = normalizeTerm(term);
    const idfScore = idf.get(normalized) || 1;

    addToVector(vector, normalized, baseWeight * idfScore);
  });

  return vector;
};

const buildUserVector = ({ library = [], idf }) => {
  const vector = new Map();

  library.forEach(({ game, weight }) => {
    const seedWeight = getSeedWeightValue(weight);

    getGameTerms(game).forEach(({ term, baseWeight }) => {
      const normalized = normalizeTerm(term);
      const idfScore = idf.get(normalized) || 1;

      addToVector(vector, normalized, seedWeight * baseWeight * idfScore);
    });
  });

  return vector;
};

const vectorNorm = (vector) => {
  let sum = 0;

  vector.forEach((value) => {
    sum += value * value;
  });

  return Math.sqrt(sum);
};

const cosineSimilarity = (userVector, gameVector) => {
  const userNorm = vectorNorm(userVector);
  const gameNorm = vectorNorm(gameVector);

  if (!userNorm || !gameNorm) return 0;

  let dot = 0;

  gameVector.forEach((gameValue, term) => {
    const userValue = userVector.get(term) || 0;

    dot += userValue * gameValue;
  });

  return dot / (userNorm * gameNorm);
};

const getMatchReasons = ({ userVector, gameVector }) => {
  const reasons = [];

  gameVector.forEach((gameValue, term) => {
    const userValue = userVector.get(term) || 0;

    if (userValue > 0) {
      reasons.push({
        term,
        score: userValue * gameValue,
      });
    }
  });

  return reasons
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.term);
};

const buildTopTasteAttributes = (userVector) => {
  const positiveTerms = Array.from(userVector.entries())
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const max = positiveTerms[0]?.[1] || 1;

  return positiveTerms.map(([term, value]) => ({
    term,
    score: Number((value / max).toFixed(2)),
  }));
};

const buildGenreBreakdown = (library = []) => {
  const genreMap = new Map();

  library.forEach(({ game, weight }) => {
    const seedWeight = Math.max(0, getSeedWeightValue(weight));

    (game.genreList || []).forEach((genre) => {
      const normalized = normalizeTerm(genre);

      genreMap.set(normalized, (genreMap.get(normalized) || 0) + seedWeight);
    });
  });

  const total = Array.from(genreMap.values()).reduce((sum, value) => {
    return sum + value;
  }, 0);

  if (!total) return [];

  return Array.from(genreMap.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      percent: Number(((count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 8);
};

const buildRecommendations = ({
  games = [],
  savedAppids = [],
  userVector,
  idf,
  limit = 6,
}) => {
  const savedSet = new Set(savedAppids.map(String));

  return games
    .filter((game) => !savedSet.has(String(game.appid)))
    .map((game) => {
      const gameVector = buildGameVector(game, idf);
      const score = cosineSimilarity(userVector, gameVector);

      return {
        ...toGameCard(game),
        similarity_score: Number(score.toFixed(4)),
        matchReasons: getMatchReasons({
          userVector,
          gameVector,
        }),
      };
    })
    .filter((game) => game.similarity_score > 0)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
};

const getLibrary = async (email) => {
  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw new Error("User not found");
  }

  const { games, map } = await parseGames();

  const savedAppids = (user.preferences || []).map(String);
  const idf = buildIdfIndex(games);

  const library = savedAppids
    .map((appid) => {
      const game = map.get(String(appid));

      if (!game) return null;

      const weight = getPreferenceWeight(user, appid);

      return {
        appid,
        weight,
        game: toGameCard(game),
        rawGame: game,
      };
    })
    .filter(Boolean);

  const vectorSeeds = library.map((item) => ({
    game: item.rawGame,
    weight: item.weight,
  }));

  const userVector = buildUserVector({
    library: vectorSeeds,
    idf,
  });

  const recommendations = buildRecommendations({
    games,
    savedAppids,
    userVector,
    idf,
    limit: 6,
  });

  return {
    savedAppids,
    library: library.map(({ rawGame, ...item }) => item),
    gamerDNA: {
      topAttributes: buildTopTasteAttributes(userVector),
      genreBreakdown: buildGenreBreakdown(vectorSeeds),
    },
    recommendations,
  };
};

const addPreference = async ({ email, appid }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const normalizedAppid = String(appid);

  if (!user.preferences.includes(normalizedAppid)) {
    user.preferences.push(normalizedAppid);
  }

  user.preferenceWeights.set(normalizedAppid, "normal");

  await user.save();

  return getLibrary(email);
};

const updatePreferenceWeight = async ({ email, appid, weight }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const normalizedAppid = String(appid);
  const normalizedWeight = normalizeWeight(weight);

  if (!user.preferences.includes(normalizedAppid)) {
    user.preferences.push(normalizedAppid);
  }

  user.preferenceWeights.set(normalizedAppid, normalizedWeight);

  await user.save();

  return getLibrary(email);
};

const removePreference = async ({ email, appid }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const normalizedAppid = String(appid);

  user.preferences = user.preferences.filter((item) => {
    return String(item) !== normalizedAppid;
  });

  user.preferenceWeights.delete(normalizedAppid);

  await user.save();

  return getLibrary(email);
};

module.exports = {
  getLibrary,
  addPreference,
  updatePreferenceWeight,
  removePreference,
};
