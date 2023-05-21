 


// async function filterDataByKeys(array, key, value) {
//   return array.filter(item => item[key] === value);
// }


function filterDataByKeys(array, keys, values) {
  return array.filter(item => {
    return keys.every((key, index) => item[key] === values[index]);
  });
}



export default filterDataByKeys;
