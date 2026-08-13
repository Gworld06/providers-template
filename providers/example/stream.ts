import { Stream, ProviderContext } from "../types";

export const getStream = async function ({
  link,
  type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  // Use the link to fetch streaming sources
  // Here we just return mock streaming data
  return [
    {
      server: "ExampleServer",
      link: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      type: "m3u8",
      quality: "1080",
    },
  ];
};
