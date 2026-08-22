import { Stream, ProviderContext } from "../types";

export const getStream = async ({
  link,
  type,
  signal,
  providerContext,
  isDownload,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
  isDownload?: boolean;
}): Promise<Stream[]> => {
  try {
    const response = await providerContext.axios.get(link, {
      signal,
      headers: providerContext.commonHeaders,
    });

    const html = response.data as string;

    // Find HLS (.m3u8) streams
    const m3u8Matches = html.match(
      /https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/g
    ) || [];

    // Find direct video streams
    const videoMatches = html.match(
      /https?:\/\/[^"'\\\s]+\.(?:mp4|mkv|webm)(?:\?[^"'\\\s]*)?/gi
    ) || [];

    const links = [...new Set([...m3u8Matches, ...videoMatches])];

    return links.map((streamLink, index) => ({
      server: `AnimeJoker ${index + 1}`,
      link: streamLink,
      type: streamLink.includes(".m3u8") ? "m3u8" : "mp4",
      quality: "1080",
    }));
  } catch (error) {
    console.error("AnimeJoker stream error:", error);
    return [];
  }
};
