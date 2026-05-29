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

const getTags = async () => {
  const { games } = await parseGames();

  const tagSet = new Set();

  games.forEach((game) => {
    game.tagList?.forEach((tag) => {
      const normalizedTag = normalize(tag);

      if (normalizedTag) {
        tagSet.add(normalizedTag);
      }
    });
  });

  return Array.from(tagSet).sort();
};

const getGamesByTag = async ({ tag, page = 1, limit = 15 }) => {
  const { games } = await parseGames();

  const normalizedTag = normalize(tag);

  const filteredGames = games.filter((game) => {
    return game.tagList?.map((item) => normalize(item)).includes(normalizedTag);
  });

  const serializedGames = filteredGames.map((game) => toGameCard(game));

  return paginate(serializedGames, page, limit);
};

module.exports = {
  getTags,
  getGamesByTag,
};
