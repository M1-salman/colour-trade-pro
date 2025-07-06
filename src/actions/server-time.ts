"use server";

export const getServerTime = async () => {
  const serverTime = Date.now();
  return serverTime;
};
