import { Stream, ProviderContext } from "../types";

function absoluteUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

export const getStream = async function ({
  link,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {

  const streams: Stream[] = [];
  const seen = new Set<string>();

  function addStream(url: string, quality = "1080") {
    if (!url) return;

    const direct = absoluteUrl(url, link);

    if (!/^https?:\/\//i.test(direct)) return;

    if (
      !direct.includes(".m3u8") &&
      !direct.includes(".mp4") &&
      !direct.includes(".webm")
    ) {
      return;
    }

    if (seen.has(direct)) return;

    seen.add(direct);

    streams.push({
      server: "AnimeJoker",
      link: direct,
      type: direct.includes(".m3u8") ? "m3u8" : "mp4",
      quality,
    });
  }

  const response = await providerContext.axios.get(link, {
    headers: providerContext.commonHeaders,
    signal,
  });

  const $ = providerContext.cheerio.load(response.data);

  $("video[src]").each((_, el) => {
    addStream($(el).attr("src") || "");
  });

  $("video source[src]").each((_, el) => {
    addStream($(el).attr("src") || "");
  });

  $("source[src]").each((_, el) => {
    addStream($(el).attr("src") || "");
  });

  const html = String(response.data);

  const mediaRegex =
    /https?:\/\/[^"'\\\s]+?\.(?:m3u8|mp4|webm)(?:\?[^"'\\\s]*)?/gi;

  const matches = html.match(mediaRegex) || [];

  for (const media of matches) {
    addStream(media);
  }

  // Look for iframe/player URLs.
  const iframeUrls: string[] = [];

  $("iframe[src], iframe[data-src]").each((_, el) => {
    const iframe =
      $(el).attr("data-src") ||
      $(el).attr("src");

    if (iframe) {
      iframeUrls.push(
        absoluteUrl(iframe, link),
      );
    }
  });

  // Fetch player pages one by one.
  for (const iframeUrl of iframeUrls) {
    try {
      const player = await providerContext.axios.get(
        iframeUrl,
        {
          headers: providerContext.commonHeaders,
          signal,
        },
      );

      const playerHtml = String(player.data);

      const playerRegex =
        /https?:\/\/[^"'\\\s]+?\.(?:m3u8|mp4|webm)(?:\?[^"'\\\s]*)?/gi;

      const playerMatches =
        playerHtml.match(playerRegex) || [];

      for (const media of playerMatches) {
        addStream(media);
      }

      const $$ =
        providerContext.cheerio.load(playerHtml);

      $$("video[src]").each((_, el) => {
        addStream($$(el).attr("src") || "");
      });

      $$("video source[src]").each((_, el) => {
        addStream($$(el).attr("src") || "");
      });

    } catch {
      // Continue with other players.
    }
  }

  return streams;
};
