import axios from "axios";
import { headers } from "./headers";
import * as cheerio from "cheerio";
import { ProviderContext } from "./types";

export const providerContext: ProviderContext = {
  axios,
  commonHeaders: headers,
  // webview not aviable in local test only avaiable in app
  openWebView: (url: string, options?: any) => {
    return Promise.resolve({
      success: false,
      data: "",
      cookies: "",
      cookieMap: {},
      userAgent: "",
      url: url,
    } as import("./types").OpenWebViewResult);
  },
  cheerio,
};
