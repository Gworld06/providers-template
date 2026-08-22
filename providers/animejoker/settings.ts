import { ProviderContext, SettingsField } from "../types";

export const getSettingsSchema = async function ({
  providerContext,
}: {
  providerContext: ProviderContext;
}): Promise<SettingsField[]> {
  return [
    {
      key: "baseUrl",
      type: "text",
      label: "AnimeJoker URL",
      description: "AnimeJoker website address",
      placeholder: "https://animejoker.com",
      defaultValue: "https://animejoker.com",
    },
  ];
};
