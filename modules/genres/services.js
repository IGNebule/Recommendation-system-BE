const { parseGames } = require("../games/services");
const { toGameCard } = require("../games/serializers");

const normalize = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const paginate = (items, page, limit) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
    data: items.slice(startIndex, endIndex),
  };
};

const getTopics = async () => {
  const { games } = await parseGames();

  const topicSet = new Set();

  games.forEach((game) => {
    if (game.browseTerms?.length) {
      game.browseTerms.forEach((term) => {
        const normalizedTerm = normalize(term);

        if (normalizedTerm) {
          topicSet.add(normalizedTerm);
        }
      });

      return;
    }

    const browseText = normalize(`
      ${game.genres || ""}
      ${game.categories || ""}
      ${game.tags || ""}
    `);

    browseText
      .split(" ")
      .map((term) => term.trim())
      .filter(Boolean)
      .forEach((term) => topicSet.add(term));
  });

  return Array.from(topicSet).sort();
};

const getGamesByTopic = async ({ topic, page = 1, limit = 15 }) => {
  const { games } = await parseGames();

  const normalizedTopic = normalize(topic);

  const filteredGames = games.filter((game) => {
    if (!normalizedTopic) return false;

    if (game.browseTerms?.length) {
      return game.browseTerms
        .map((term) => normalize(term))
        .includes(normalizedTopic);
    }

    const browseText = normalize(`
      ${game.genres || ""}
      ${game.categories || ""}
      ${game.tags || ""}
    `);

    const terms = browseText.split(" ");

    return terms.includes(normalizedTopic);
  });

  const serializedGames = filteredGames.map((game) => toGameCard(game));

  return paginate(serializedGames, page, limit);
};

module.exports = {
  getTopics,
  getGamesByTopic,
};
