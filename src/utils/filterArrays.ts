  
async function filterDataByKeys(dataPromise, keys, searchTerm) {
  const data = await dataPromise;

  console.log(data)
  return data.filter(item => {
    const values = Object.values(item).map(value => String(value).toLowerCase());
    return keys.some(key => values.some(value => value.includes(searchTerm.toLowerCase()) && key === Object.keys(item)[values.indexOf(value)]));
  });
}


export default filterDataByKeys
