// SCAFFOLD ONLY | TODO: Wrap asynchronous request handlers and forward failures to error middleware.
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
