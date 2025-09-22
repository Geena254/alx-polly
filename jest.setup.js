import 'whatwg-fetch'; // polyfills fetch, Request, Response

if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {};
}

import '@testing-library/jest-dom';