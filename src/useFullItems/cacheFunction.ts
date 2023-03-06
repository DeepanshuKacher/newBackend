const Cache = () => {
  const cache = {};

  return (type: "get" | "add", dataName: string, value?: any) => {
    if (type === "get") return cache[dataName];
    else if (type === "add") {
      if (value) {
        cache[dataName] = value;
        return cache[dataName];
      } else return false;
    }
  };
};

export const cacheFunction = Cache();
