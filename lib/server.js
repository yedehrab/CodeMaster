/*
 * Sunucu işlemleri
 * @author Yunus Emre
 */

import { createServer as createHttpServer } from "http";
import { httpPort } from "./config";
import { parse as parseUrl } from "url";
import { StringDecoder as stringDecoder } from "string_decoder";
import { analysts } from "./handler";
import { fixPayloadForJSON, JSONtoObject, fixStatusCode } from "./helpers";

/**
 * HTTP sunucusunu başlatır
 */
export function startHttpServer() {
  _httpServer.listen(httpPort, () => {
    console.log(`Sunucu ${httpPort} üzerinden dinleniyor.`)
  });
}

/**
 * Http server sunucusu yapılandırması
 */
const _httpServer = createHttpServer((request, response) => {
  _unifiedServer(request, response);
});

/**
 * Ortak sunucu yapılandırması
 */
const _unifiedServer = (request, response) => {
  /**
   * Url ayrıştırma işlemi (obje olarak alıyoruz)
   * - *Örnek : `{... query: {}, pathname: "/ornek" ... }` şeklinde bir url classı*
   */
  const parsedUrl = parseUrl(request.url, true);

  /**
   * Sorgu kelimesini (query string) obje olarak almak.
   * - *Örnek: `curl localhost:3000/foo?test=testtir` => `{ test : "testtir" }`*
   * - *Not : `?test=testtir` sorgu dizgisidir.*
   */
  const queryStringObject = parsedUrl.query;

  /**
   * Ayrıştırılan urldeki pathname değişkenindeki değeri yol'a alıyorz.
   * - *Örnek: `curl localhost:3000/ornek/test/` => yolu `/ornek/test/`*
   * - *Not: sorgu dizgileri ele alınmaz ( `curl localhost:3000/ornek?foo=bar` => yolu `/ornek` )*
   */
  const path = parsedUrl.pathname;

  /**
   * Replace içinde verilen işaretler çıkartılarak alınan yol.
   * - *Örnek: `/ornek` -> `ornek` veya `/ornek/test/` -> `ornek/test/` olarak kırpılmakta.*
   * - *Not: Sadece **ilk karakter** kırpılıyor (?)*
   */
  const trimmedPath = path.replace(/^\/+|\+$/g, "");

  /**
   * HTTP metodu alma
   * - *Örnek: `GET`, `POST`, `PUT`, `DELETE` ...*
   * - *Not: Küçük harfe çevirip alıyoruz.*
   */
  const method = request.method.toLowerCase();

  /**
   * İsteğin içindeki başlıkları (header keys) obje olarak almak.
   * - *Not: Postman ile headers sekmesinde gönderilen anahtarları (keys)*
   * *ve değerlerini (the value of them) içerir.*
   */
  const headers = request.headers;

  /**
   * ASCI kodlarını çözümlemek için kod çözücü tanımlama
   * - *Not: `utf-8` çözümleme yöntemidir*
   */
  const decoder = new stringDecoder("utf-8");
  let buffer = ""; // Yükleri kayıt edeceğimiz tamponu oluşturuyoruz.

  /**
   * İstekte veri geldiği anda yapılacak işlemler
   */
  request.on("data", data => {
    /**
     * ASCI kodlarını "utf-8" formatında çözümlüyoruz.
     * - *Ornek: 42 75 -> Bu [ 42 = B, 75 = u]*
     */
    buffer += decoder.write(data);
  });

  /**
   * İstek sonlandığı anda yapılacak işlemler
   */
  request.on("end", () => {
    // Kod çözümlemeyi kapatıyoruz.
    buffer += decoder.end();

    /**
     * İşleyiciye gönderilen veri objesi oluşturma
     * - *Not: Her dosyada kullanılan veri objesidir.*
     * - *Örnek:*
     ```javascript
     { 
        "trimmedPath" = "ornek" 
        "queryStringObject" = {}
        "method" = "post"
        "headers" = {"isim" : "Yunus Emre"}
        "payload": JSONtoObject(buffer)
     }
     ```
     */
    const requestData = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: JSONtoObject(buffer)
    };
    // Yanıt oluşturma
    _createResponse(requestData, response);
  });
};

/**
 * Sunucu tarafından verilecek yanıtı oluşturma
 * @param {object} requestData İstek verileri
 * @param {string} response Yanıt dizgisi
 */
const _createResponse = (requestData, response) => {
  analysts(requestData, (statusCode, payload) => {
    // Durum kodunu düzenleme
    statusCode = fixStatusCode(statusCode);

    // Yanıt için başlıkları ayarlama
    response.setHeader("Content-Type", 'application/json');

    // Yük dizgisini ayarlama
    const payloadString = fixPayloadForJSON(payload);

    // Yanıt için durum kodunu ve geri dönüş yüklerini ayarlama
    response.writeHead(statusCode);
    response.end(payloadString);

    // Yanıt hakkında bilgi gösterme (debug)
    _showResponseInfos(statusCode, requestData);
  });
};

/**
 * Sunucu yanıtı hakkında bilgilendirme
 * @param {number} statusCode Sunucu durum kodu
 * @param {object} requestData Sunucuya gönderilen istek verisi
 */
const _showResponseInfos = (statusCode, requestData) => {
  // İşlem yanıtı olumlu ise yeşil, değilse kırmızı yazma
  // debug(
  //   getNamespace(__filename, _showResponseInfos.name),
  //   statusCode == 200 ? "succes" : "warn",
  //   `Method: '${requestData.method}' Path: '${requestData.trimmedPath}' Status: ${statusCode}`
  // );
};
