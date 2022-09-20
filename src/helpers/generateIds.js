import { v4 as uuidv4 } from "uuid";
function stuLoginID(size) {
  const nanoid = customAlphabet("1234567890abcdef", 10);
  return nanoid(size);
}

function randomId(size, custAlpha = "1234567890abcdef") {
  return uuidv4();
}

export { stuLoginID, randomId };
