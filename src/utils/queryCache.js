 
const cache = new Map();  

const setQueryCache = (key, value, ttl = 300) => {
  cache.set(key, { value, expiry: Date.now() + ttl * 1000 });
};

const getQueryCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    // cache.delete(key);
    // return null;
  }
  return entry.value;
};

module.exports = { setQueryCache, getQueryCache };
