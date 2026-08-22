import { Post, ProviderContext } from "../types";

const BASE_URL = "https://animejoker.com";

function absoluteUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function parsePosts(
  html: string,
  providerContext: ProviderContext,
  baseUrl: string,
): Post[] {
  const $ = providerContext.cheerio.load(html);
  const results: Post[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const a = $(element);
    const href = a.attr("href");

    if (!href) return;

    const link = absoluteUrl(href, baseUrl);

    if (
      !link.includes("animejoker.com/series/") &&
      !link.includes("animejoker.com/movie/")
    ) {
      return;
    }

    if (seen.has(link)) return;

    const title = clean(
      a.find("h2, h3, h4").first().text() ||
      a.attr("title") ||
      a.find("img").attr("alt") ||
      a.text(),
    );

    if (!title) return;

    const image =
      a.find("img").attr("data-src") ||
      a.find("img").attr("data-lazy-src") ||
      a.find("img").attr("src") ||
      "";

    seen.add(link);

    results.push({
      title,
      link,
      image: image ? absoluteUrl(image, baseUrl) : "",
    });
  });

  return results;
}

export const getPosts = async function ({
  filter,
  page,
  providerValue,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const path = filter || "/";

  const url = new URL(path, BASE_URL);

  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  const response = await providerContext.axios.get(url.href, {
    headers: providerContext.commonHeaders,
    signal,
  });

  return parsePosts(response.data, providerContext, BASE_URL);
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
  providerValue,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const url = new URL("/", BASE_URL);

  url.searchParams.set("s", searchQuery);

  if (page > 1) {
    url.searchParams.set("paged", String(page));
  }

  const response = await providerContext.axios.get(url.href, {
    headers: providerContext.commonHeaders,
    signal,
  });

  return parsePosts(response.data, providerContext, BASE_URL);
};
