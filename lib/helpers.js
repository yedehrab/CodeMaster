/**
 * Http methodu kontrolünü sağlar
 * - *Not: Büyük-küçük harf duyarlı değildir*
 * @param {object} data Index.js"te tanımlanan veri objesidir
 * @param {string} httpMethod GET, set, Post ...
 * @return {boolean} Eğer eşit ise `true`
 */
export function checkDataMethod(data, httpMethod) {
  try {
    return data.method.toLowerCase() == httpMethod.toLowerCase();
  } catch (e) {
    return false;
  }
}

/**
 * Durum kodu düzeltmesi
 * @param {number} statusCode Durum kodu (200, 404)
 * @return {number | boolean} Hata varsa false yoksa durum kodunu döndürür
 */
export function fixStatusCode(statusCode) {
  return typeof statusCode == "number" ? statusCode : 200;
}

/**
 * Yükü JSON için düzeltme
 * @param {object} payload Yük objesi
 * @return {string} JSON dizgisi
 */
export function fixPayloadForJSON(payload) {
  payload = typeof payload == "object" ? payload : {};
  return JSON.stringify(payload);
}

/**
 * Json'u objeye dönüştürme (parsing)
 * @param {string} str Dönüştürülecek json verisi
 * @return {JSON} JSON objesi veya boş obje
 */
export function JSONtoObject(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
}

/**
 * Obje değeri düzeltme
 * @param {object} obj Obje
 * @return Eğer undefined ise undefined string'i döndürür
 */
export function fixObjectValue(obj) {
  return typeof obj != 'undefined' ? obj : 'undefined';
}
