/**
 * Get Data from Store

 *
 * @param {string} key
 * @param {boolean} isString
 */
export function GetStoreData(key, isString = true) {

  let data = localStorage.getItem(key);
  if (isString) return data;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Set data from store

 *
 * @param {string} key
 * @param {object} item
 */
export function SetStoreData(key, item) {
  try {
    return localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.log(error.message);
  }
}
