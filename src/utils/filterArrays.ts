// async function filterDataByKeys(dataPromise, keys, searchTerm) {

//   const data = await dataPromise;

//   console.log(data);

//   return data.filter(item => {
//     const values = Object.values(item).map(value => String(value).toLowerCase());
//     return keys.some(key => {
//       const index = values.findIndex(value => value.includes(searchTerm.toLowerCase()));
//       return index !== -1 && key === Object.keys(item)[index];
//     });
//   });
// }


async function filterDataByKeys(array, key, value) {
  return array.filter(item => item[key] === value);
}

export default filterDataByKeys;
