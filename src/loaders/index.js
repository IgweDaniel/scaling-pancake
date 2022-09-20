import expressLoader from "./express";

function init(ctx) {
  return { app: expressLoader(ctx) };
}

export default init;
