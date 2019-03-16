/*
 * Sayfa kalıbı işleyicileri
 */
import { checkDataMethod, fixObjectValue } from "./helpers";
import { get } from "request";
import cheerio from "cheerio";

/**
 * Siteyi analiz etme işleyicisi
 * @param {object} data Index.js"te tanımlanan veri objesidir. İstekle gelir.
 * @param {function(number, string, string):void} callback İşlemler bittiği zaman verilen yanıt
 * - *arg0: HTTP varsayılan durum kodları*
 * - *arg0: HTTP yanıtı veya ilgili ek açıklamalar {Info, Detail?}*
 */
export function analysts(data, callback) {
  // Sadece get metoduyla çalışır
  if (checkDataMethod(data, "get")) {
    const begin_time = new Date().getTime(); // YAPILACAK ----------------------------------------------------------------------
    // Analiz sonucu
    const analysis = {
      url: fixObjectValue(data.queryStringObject.url),
      analysisDuration: "toplam süre",
      redirectedURLs: [],
      responseCode: "TODO",
      responseMessage: "TODO",
      internalLinks: [],
      externalLinks: []
    };

    // Analiz edilecek url'i oluşturma
    analysis.url = fixObjectValue(data.queryStringObject.url);

    // Linkleri saklama
    const siteLinks = [];

    get(analysis.url, (err, response, body) => {
      const $ = cheerio.load(body);
      const links = $("a"); //jquery get all hyperlinks

      analysis.responseMessage = response.statusMessage;
      analysis.responseCode = response.statusCode;

      // Linkleri ayırma ve alma
      for (let i = 0; i < links.length; i++) {
        const href = $(links[i]).attr("href");
        getMoreInfo(href, detail => {
          if (detail.finalUrl.toString().includes("obss")) {
            analysis.internalLinks.push(detail);
          } else {
            analysis.externalLinks.push(detail);
          }
          if (
            analysis.internalLinks.length + analysis.externalLinks.length ==
            links.length
          ) {
            analysis.analysisDuration = new Date().getTime() - begin_time;
            callback(200, analysis);
          }
        });
      }
    });
  } else {
    callback(404, { info: `Wrong request ${data.method}` });
  }
}

function getMoreInfo(url, callback) {
  get(url, { maxRedirects: 3 }, (err, response, body) => {
    const first_time = new Date().getTime();

    let finalUrl = "";
    let responseMessage = "";
    let responseCode = 404;
    let contentLength = 0;

    if (err) {
      if (err.toString().includes("protocol")) {
        responseCode = 400;
        responseMessage = "Bad request";
      } else if (err.toString().includes("maxRedirects")) {
        finalUrl = err
          .toString()
          .split("\n")[0]
          .split("Probably stuck in a redirect loop ")[1];
        responseMessage = "Too many redirect";
        responseCode = 310;
      }
    } else {
      finalUrl = response.request.href;
      contentLength = response.body.length;
      responseCode = response.statusCode;
      responseMessage = response.statusMessage;
    }

    console.log(JSON.stringify(response));

    // MS'den saniyeyi hesaplama
    const totalAccessDuration = new Date().getTime() - first_time;
    callback({
      parsedUrl: url,
      finalUrl: finalUrl,
      secured: finalUrl.includes("https") ? true : false,
      reachable: typeof response == "undefined" ? false : true, //?
      redirectedURLs: [],
      totalAccessDuration: totalAccessDuration,
      contentLength: contentLength, // ? content fazla veya erişelemez ise gösterme
      responseCode: responseCode,
      responseMessage: responseMessage
    });
  });
}
