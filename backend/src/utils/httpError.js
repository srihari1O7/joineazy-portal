// backend/src/utils/httpError.js
export const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};