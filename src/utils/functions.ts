export const generateRandomString = (length: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};

export const log = (value: string) => {
  console.log("[PPR ADMIN PORTAL] " + value);
};
