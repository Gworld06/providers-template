import { Info, ProviderContext } from "../types";

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function absoluteUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

export const getMeta = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  const response = await providerContext.axios.get(link, {
    headers: providerContext.commonHeaders,
  });

  const $ = providerContext.cheerio.load(response.data);

  const title = clean(
    $("h1").first().text() ||
      $("meta[property='og:title']").attr("content") ||
      "",
  );

  const image =
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content") ||
    $("img").first().attr("src") ||
    "";

  const synopsis = clean(
    $(".overview, .description, .summary").first().text() ||
      $("meta[name='description']").attr("content") ||
      "",
  );

  const text = clean($("body").text());

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const ratingMatch = text.match(/([\d.]+)\s*TMDB/i);

  const tags: string[] = [];

  const genresHeading = $("*:contains('Genres')").filter(function () {
    return clean($(this).text()) === "Genres";
  }).first();

  if (genresHeading.length) {
    const parentText = clean(genresHeading.parent().text());
    const parts = parentText.split(/Genres/i)[1] || "";

    parts
      .split(",")
      .map((x) => clean(x))
      .filter(Boolean)
      .forEach((x) => {
        if (!tags.includes(x)) tags.push(x);
      });
  }

  const linkList: Info["linkList"] = [];

  /*
   * AnimeJoker places episode links on the series page.
   * We collect only the public episode-page URLs.
   */
  $("a[href]").each((_, element) => {
    const a = $(element);
    const href = a.attr("href");

    if (!href) return;

    const episodeLink = absoluteUrl(href, link);

    if (!/\/episode\//i.test(episodeLink)) return;

    const episodeTitle = clean(
      a.find("h2, h3, h4").first().text() ||
        a.attr("title") ||
        a.text(),
    );

    if (!episodeTitle) return;

    const exists = linkList.some((item) =>
      item.directLinks?.some((direct) => direct.link === episodeLink),
    );

    if (exists) return;

    linkList.push({
  title: "Episodes",
  directLinks: [
    {
      title: episodeTitle,
      link: episodeLink,
    },
  ],
});

  /*
   * If the site uses a different episode URL format,
   * keep the metadata usable even when no episode links
   * are discovered.
   */
  if (linkList.length === 0) {
    linkList.push({
      title: "AnimeJoker",
      directLinks: [],
    });
  }

  return {
    title,
    image: image ? absoluteUrl(image, link) : "",
    poster: image ? absoluteUrl(image, link) : "",
    synopsis,
    imdbId: "",
    tmdbId: "",
    type: /\/series\//i.test(link) ? "series" : "movie",
    tags,
    rating: ratingMatch?.[1] || "",
    linkList,
    webUrl: link,
  };
};
