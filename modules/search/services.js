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

const searchGames = async ({ query, page = 1, limit = 15 }) => {
  const { games } = await parseGames();
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return {
      page,
      limit,
      total: 0,
      totalPages: 0,
      data: [],
    };
  }

  const filteredGames = games.filter((game) => {
    const searchText = normalize(`
      ${game.search_name || ""}
      ${game.developer || ""}
      ${game.publisher || ""}
    `);

    return searchText.includes(normalizedQuery);
  });

  const serializedGames = filteredGames.map((game) => toGameCard(game));

  return paginate(serializedGames, page, limit);
};

module.exports = {
  searchGames,
};
