// src/utils/stripe.ts
var stripe_exports = {};
__export(stripe_exports, {
  STRIPE_PRICES: () => STRIPE_PRICES,
  createAccountLink: () => createAccountLink,
  createCheckoutSession: () => createCheckoutSession,
  createConnectAccount: () => createConnectAccount,
  createPortalSession: () => createPortalSession,
  createStripePaymentLink: () => createStripePaymentLink
});
async function createStripePaymentLink(env, amount, description, connectedAccountId) {
  const connectHeaders = connectedAccountId ? { "Stripe-Account": connectedAccountId } : {};
  const productResponse = await fetch("https://api.stripe.com/v1/products", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...connectHeaders
    },
    body: new URLSearchParams({
      name: description,
      description: `Invoice payment via NudgePay`
    })
  });
  const product = await productResponse.json();
  if (!productResponse.ok) {
    throw new Error(`Stripe product error: ${product.error?.message}`);
  }
  const linkParams = new URLSearchParams({
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": description,
    "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
    "line_items[0][quantity]": "1",
    "after_completion[type]": "redirect",
    "after_completion[redirect][url]": `${env.FRONTEND_URL}/payment-success`
  });
  if (connectedAccountId) {
    const feeAmount = Math.round(amount * 100 * 0.01);
    linkParams.set("application_fee_amount", String(feeAmount));
  }
  const linkResponse = await fetch("https://api.stripe.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...connectHeaders
    },
    body: linkParams
  });
  const link = await linkResponse.json();
  if (!linkResponse.ok) {
    throw new Error(`Stripe payment link error: ${link.error?.message}`);
  }
  return link.url;
}
async function createConnectAccount(env, email) {
  const response = await fetch("https://api.stripe.com/v1/accounts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      type: "express",
      email,
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
      business_type: "individual"
    })
  });
  const account = await response.json();
  if (!response.ok) {
    throw new Error(`Stripe Connect account error: ${account.error?.message}`);
  }
  return account.id;
}
async function createAccountLink(env, accountId, userId) {
  const response = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      account: accountId,
      refresh_url: `${env.FRONTEND_URL}/settings?connect=refresh&user_id=${userId}`,
      return_url: `${env.FRONTEND_URL}/settings?connect=complete`,
      type: "account_onboarding"
    })
  });
  const link = await response.json();
  if (!response.ok) {
    throw new Error(`Stripe account link error: ${link.error?.message}`);
  }
  return link.url;
}
async function createCheckoutSession(env, customerId, priceId, successUrl, cancelUrl) {
  const params = new URLSearchParams({
    "mode": "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "success_url": successUrl,
    "cancel_url": cancelUrl
  });
  if (customerId) {
    params.set("customer", customerId);
  }
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const session = await response.json();
  if (!response.ok) {
    throw new Error(`Stripe checkout error: ${session.error?.message}`);
  }
  return session.url;
}
async function createPortalSession(env, customerId, returnUrl) {
  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      customer: customerId,
      return_url: returnUrl
    })
  });
  const session = await response.json();
  if (!response.ok) {
    return returnUrl;
  }
  return session.url;
}
var STRIPE_PRICES;
var init_stripe = __esm({
  "src/utils/stripe.ts"() {
    "use strict";
    __name(createStripePaymentLink, "createStripePaymentLink");
    __name(createConnectAccount, "createConnectAccount");
    __name(createAccountLink, "createAccountLink");
    __name(createCheckoutSession, "createCheckoutSession");
    __name(createPortalSession, "createPortalSession");
    STRIPE_PRICES = {
      starter: "price_1TC95hJaJ4gKTQE5A4FOQOFu",
      pro: "price_1TC96NJaJ4gKTQE57snigPdp"
    };
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// src/utils/crypto.ts
function generateToken(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateToken, "generateToken");
function generateId() {
  return generateToken(16);
}
__name(generateId, "generateId");
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashToken, "hashToken");
async function createJWT(payload, secret) {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const message = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${message}.${signatureB64}`;
}
__name(createJWT, "createJWT");
async function verifyJWT(token, secret) {
  try {
    const encoder = new TextEncoder();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signatureBytes = Uint8Array.from(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(message));
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");

// src/utils/email.ts
async function sendEmail(env, options) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: options.from || `NudgePay <${env.FROM_EMAIL}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        ...options.replyTo ? { reply_to: options.replyTo } : {}
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Resend API error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}
__name(sendEmail, "sendEmail");
async function notifyUser(env, userEmail, subject, bodyHtml) {
  await sendEmail(env, {
    to: userEmail,
    subject: `[NudgePay] ${subject}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">\u{1F4B8} NudgePay</h1>
        </div>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px;">
          ${bodyHtml}
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          <a href="${env.FRONTEND_URL}/dashboard" style="color: #6366f1;">View Dashboard</a>
        </p>
      </div>
    `
  });
}
__name(notifyUser, "notifyUser");

// src/auth/magic-link.ts
var TOKEN_EXPIRY_MINUTES = 15;
var SESSION_EXPIRY_DAYS = 30;
async function sendMagicLink(env, email) {
  email = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email address" };
  }
  let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    const result = await env.DB.prepare(
      "INSERT INTO users (email, display_name) VALUES (?, ?) RETURNING id"
    ).bind(email, email.split("@")[0]).first();
    if (!result) {
      return { success: false, error: "Failed to create account" };
    }
    await env.DB.prepare(
      "INSERT INTO user_settings (user_id) VALUES (?)"
    ).bind(result.id).run();
    user = { id: result.id };
  }
  const rawToken = generateToken(32);
  const hashedToken = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1e3).toISOString();
  await env.DB.prepare(
    "INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
  ).bind(user.id, hashedToken, expiresAt).run();
  const loginUrl = `${env.APP_URL}/auth/verify?token=${rawToken}`;
  const isNew = !user;
  await sendEmail(env, {
    to: email,
    subject: "Sign in to NudgePay",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">\u{1F4B8} NudgePay</h1>
          <p style="color: #666; margin-top: 8px;">${isNew ? "Welcome! Let's get you started." : "Welcome back!"}</p>
        </div>

        <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #333; font-size: 16px; margin: 0 0 24px;">Click the button below to sign in. This link expires in ${TOKEN_EXPIRY_MINUTES} minutes.</p>

          <a href="${loginUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Sign In to NudgePay
          </a>

          <p style="color: #999; font-size: 13px; margin-top: 24px;">
            Or copy this link:<br>
            <code style="background: #fff; padding: 4px 8px; border-radius: 4px; word-break: break-all; font-size: 12px;">${loginUrl}</code>
          </p>
        </div>

        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `
  });
  return { success: true };
}
__name(sendMagicLink, "sendMagicLink");
async function verifyMagicLink(env, rawToken) {
  const hashedToken = await hashToken(rawToken);
  const authToken = await env.DB.prepare(
    `SELECT at.id, at.user_id, at.expires_at, at.used, u.email
     FROM auth_tokens at
     JOIN users u ON u.id = at.user_id
     WHERE at.token = ?`
  ).bind(hashedToken).first();
  if (!authToken) {
    return { success: false, error: "Invalid or expired link" };
  }
  if (authToken.used) {
    return { success: false, error: "This link has already been used" };
  }
  if (new Date(authToken.expires_at) < /* @__PURE__ */ new Date()) {
    return { success: false, error: "This link has expired" };
  }
  await env.DB.prepare("UPDATE auth_tokens SET used = 1 WHERE id = ?").bind(authToken.id).run();
  const sessionToken = await createJWT(
    {
      user_id: authToken.user_id,
      email: authToken.email,
      exp: Math.floor(Date.now() / 1e3) + SESSION_EXPIRY_DAYS * 86400
    },
    env.RESEND_API_KEY
    // Use API key as JWT secret (good enough for this)
  );
  return { success: true, token: sessionToken };
}
__name(verifyMagicLink, "verifyMagicLink");
async function getUserFromRequest(env, request) {
  const authHeader = request.headers.get("Authorization");
  let token;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookie = request.headers.get("Cookie");
    const sessionCookie = cookie?.split(";").find((c) => c.trim().startsWith("session="));
    if (!sessionCookie) return null;
    token = sessionCookie.split("=")[1].trim();
  }
  // Validate token format: should have exactly 3 parts separated by dots
  if (!token || token.split('.').length !== 3) {
    return null;
  }
  const payload = await verifyJWT(token, env.RESEND_API_KEY);
  if (!payload?.user_id) return null;
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.user_id).first();
}
__name(getUserFromRequest, "getUserFromRequest");
function requireAuth(handler) {
  return async (env, request) => {
    const user = await getUserFromRequest(env, request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    return handler(env, user, request);
  };
}
__name(requireAuth, "requireAuth");

// src/routes/invoices.ts
var listInvoices = requireAuth(async (env, user, request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const sort = url.searchParams.get("sort") || "created_at";
  const order = url.searchParams.get("order") || "desc";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const allowedSorts = ["created_at", "due_date", "amount", "client_name", "status"];
  const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";
  let query = "SELECT * FROM invoices WHERE user_id = ?";
  const params = [user.id];
  if (status && ["outstanding", "paid", "paused", "cancelled"].includes(status)) {
    query += " AND status = ?";
    params.push(status);
  }
  query += ` ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  const results = await env.DB.prepare(query).bind(...params).all();
  let countQuery = "SELECT COUNT(*) as total FROM invoices WHERE user_id = ?";
  const countParams = [user.id];
  if (status) {
    countQuery += " AND status = ?";
    countParams.push(status);
  }
  const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
  return new Response(JSON.stringify({
    invoices: results.results,
    total: countResult?.total || 0,
    limit,
    offset
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
var createInvoice = requireAuth(async (env, user, request) => {
  const body = await request.json();
  if (!body.client_name || !body.amount || !body.due_date) {
    return new Response(JSON.stringify({
      error: "Missing required fields: client_name, amount, due_date"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (body.amount <= 0) {
    return new Response(JSON.stringify({ error: "Amount must be greater than 0" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const planLimits = { free: 5, starter: 50, pro: Infinity };
  const limit = planLimits[user.plan] || 5;
  if (user.invoices_used >= limit) {
    return new Response(JSON.stringify({
      error: `You've reached your ${user.plan} plan limit of ${limit} invoices. Upgrade to add more.`
    }), {
      status: 402,
      headers: { "Content-Type": "application/json" }
    });
  }
  const id = generateId();
  const dueDate = new Date(body.due_date);
  const now = /* @__PURE__ */ new Date();
  const nextReminder = dueDate < now ? now.toISOString() : new Date(dueDate.getTime() + 864e5).toISOString();
  await env.DB.prepare(`
    INSERT INTO invoices (id, user_id, client_name, client_email, client_phone, amount, currency, description, due_date, source, next_reminder_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?)
  `).bind(
    id,
    user.id,
    body.client_name,
    body.client_email || null,
    body.client_phone || null,
    body.amount,
    body.currency || "USD",
    body.description || null,
    body.due_date,
    nextReminder
  ).run();
  await env.DB.prepare("UPDATE users SET invoices_used = invoices_used + 1 WHERE id = ?").bind(user.id).run();
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
  return new Response(JSON.stringify({ invoice }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
});
var getInvoice = requireAuth(async (env, user, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND user_id = ?").bind(id, user.id).first();
  if (!invoice) {
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const reminders = await env.DB.prepare(
    "SELECT * FROM reminders WHERE invoice_id = ? ORDER BY sent_at DESC"
  ).bind(id).all();
  const conversations = await env.DB.prepare(
    "SELECT * FROM conversations WHERE invoice_id = ? ORDER BY created_at ASC"
  ).bind(id).all();
  return new Response(JSON.stringify({
    invoice,
    reminders: reminders.results,
    conversations: conversations.results
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
var updateInvoice = requireAuth(async (env, user, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  const body = await request.json();
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND user_id = ?").bind(id, user.id).first();
  if (!invoice) {
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const updates = [];
  const params = [];
  if (body.status && ["outstanding", "paid", "paused", "cancelled"].includes(body.status)) {
    updates.push("status = ?");
    params.push(body.status);
    if (body.status === "paid") {
      updates.push('paid_at = datetime("now")');
      updates.push("next_reminder_at = NULL");
    }
    if (body.status === "paused") {
      updates.push("next_reminder_at = NULL");
    }
    if (body.status === "outstanding" && invoice.status === "paused") {
      updates.push('next_reminder_at = datetime("now")');
    }
  }
  if (body.client_name) {
    updates.push("client_name = ?");
    params.push(body.client_name);
  }
  if (body.client_email !== void 0) {
    updates.push("client_email = ?");
    params.push(body.client_email);
  }
  if (body.client_phone !== void 0) {
    updates.push("client_phone = ?");
    params.push(body.client_phone);
  }
  if (body.amount) {
    updates.push("amount = ?");
    params.push(body.amount);
  }
  if (body.due_date) {
    updates.push("due_date = ?");
    params.push(body.due_date);
  }
  if (body.description !== void 0) {
    updates.push("description = ?");
    params.push(body.description);
  }
  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: "No updates provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  updates.push('updated_at = datetime("now")');
  params.push(id, user.id);
  await env.DB.prepare(
    `UPDATE invoices SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`
  ).bind(...params).run();
  const updated = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
  return new Response(JSON.stringify({ invoice: updated }), {
    headers: { "Content-Type": "application/json" }
  });
});
var deleteInvoice = requireAuth(async (env, user, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  const result = await env.DB.prepare(
    `UPDATE invoices SET status = 'cancelled', next_reminder_at = NULL, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).bind(id, user.id).run();
  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

// src/routes/stats.ts
var getStats = requireAuth(async (env, user, _request) => {
  const now = /* @__PURE__ */ new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const outstanding = await env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM invoices WHERE user_id = ? AND status = 'outstanding'
  `).bind(user.id).first();
  const overdue = await env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM invoices WHERE user_id = ? AND status = 'outstanding' AND due_date < date('now')
  `).bind(user.id).first();
  const paidThisMonth = await env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM invoices WHERE user_id = ? AND status = 'paid' AND paid_at >= ?
  `).bind(user.id, monthStart).first();
  const avgDays = await env.DB.prepare(`
    SELECT AVG(julianday(paid_at) - julianday(created_at)) as avg_days
    FROM invoices WHERE user_id = ? AND status = 'paid' AND paid_at IS NOT NULL
  `).bind(user.id).first();
  const totalCreated = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status != 'cancelled'
  `).bind(user.id).first();
  const totalPaid = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = 'paid'
  `).bind(user.id).first();
  const collectionRate = (totalCreated?.count || 0) > 0 ? Math.round((totalPaid?.count || 0) / totalCreated.count * 100) : 0;
  const recentInvoices = await env.DB.prepare(`
    SELECT id, client_name, amount, status, created_at, paid_at
    FROM invoices WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `).bind(user.id).all();
  const upcomingReminders = await env.DB.prepare(`
    SELECT i.id, i.client_name, i.amount, i.next_reminder_at, i.reminder_count
    FROM invoices i
    WHERE i.user_id = ? AND i.status = 'outstanding' AND i.next_reminder_at IS NOT NULL
    ORDER BY i.next_reminder_at ASC LIMIT 5
  `).bind(user.id).all();
  const stats = {
    total_outstanding: outstanding?.total || 0,
    total_overdue: overdue?.total || 0,
    total_paid_this_month: paidThisMonth?.total || 0,
    count_outstanding: outstanding?.count || 0,
    count_overdue: overdue?.count || 0,
    count_paid_this_month: paidThisMonth?.count || 0,
    avg_days_to_pay: avgDays?.avg_days ? Math.round(avgDays.avg_days) : null,
    collection_rate: collectionRate
  };
  return new Response(JSON.stringify({
    stats,
    recent_invoices: recentInvoices.results,
    upcoming_reminders: upcomingReminders.results,
    plan: user.plan,
    invoices_used: user.invoices_used
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
var getSettings = requireAuth(async (env, user, _request) => {
  const settings = await env.DB.prepare("SELECT * FROM user_settings WHERE user_id = ?").bind(user.id).first();
  return new Response(JSON.stringify({
    user: {
      email: user.email,
      phone: user.phone,
      display_name: user.display_name,
      plan: user.plan,
      timezone: user.timezone
    },
    settings
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
var updateSettings = requireAuth(async (env, user, request) => {
  const body = await request.json();
  const userUpdates = [];
  const userParams = [];
  if (body.display_name) {
    userUpdates.push("display_name = ?");
    userParams.push(body.display_name);
  }
  if (body.phone !== void 0) {
    userUpdates.push("phone = ?");
    userParams.push(body.phone);
  }
  if (body.timezone) {
    userUpdates.push("timezone = ?");
    userParams.push(body.timezone);
  }
  if (userUpdates.length > 0) {
    userUpdates.push('updated_at = datetime("now")');
    userParams.push(user.id);
    await env.DB.prepare(`UPDATE users SET ${userUpdates.join(", ")} WHERE id = ?`).bind(...userParams).run();
  }
  const settingsUpdates = [];
  const settingsParams = [];
  if (body.tone) {
    settingsUpdates.push("tone = ?");
    settingsParams.push(body.tone);
  }
  if (body.chase_frequency_days) {
    settingsUpdates.push("chase_frequency_days = ?");
    settingsParams.push(body.chase_frequency_days);
  }
  if (body.email_signature !== void 0) {
    settingsUpdates.push("email_signature = ?");
    settingsParams.push(body.email_signature);
  }
  if (body.auto_payment_link !== void 0) {
    settingsUpdates.push("auto_payment_link = ?");
    settingsParams.push(body.auto_payment_link ? 1 : 0);
  }
  if (body.notify_on_reply !== void 0) {
    settingsUpdates.push("notify_on_reply = ?");
    settingsParams.push(body.notify_on_reply ? 1 : 0);
  }
  if (body.notify_on_payment !== void 0) {
    settingsUpdates.push("notify_on_payment = ?");
    settingsParams.push(body.notify_on_payment ? 1 : 0);
  }
  if (body.quiet_hours_start !== void 0) {
    settingsUpdates.push("quiet_hours_start = ?");
    settingsParams.push(body.quiet_hours_start);
  }
  if (body.quiet_hours_end !== void 0) {
    settingsUpdates.push("quiet_hours_end = ?");
    settingsParams.push(body.quiet_hours_end);
  }
  if (settingsUpdates.length > 0) {
    settingsUpdates.push('updated_at = datetime("now")');
    settingsParams.push(user.id);
    await env.DB.prepare(`UPDATE user_settings SET ${settingsUpdates.join(", ")} WHERE user_id = ?`).bind(...settingsParams).run();
  }
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

// src/ai/prompts.ts
var SMS_PARSE_SYSTEM = `You are an invoice data extractor. Parse natural language messages into structured invoice data.

Extract:
- client_name: The person/company being invoiced (REQUIRED)
- client_email: Email address if mentioned
- client_phone: Phone number if mentioned
- amount: Dollar amount (REQUIRED, number only)
- due_date: When it was/is due. Convert relative dates like "last week", "yesterday", "3 days ago", "net 30" to actual ISO dates. Today's date is {today}.
- description: What the invoice is for, if mentioned

Rules:
- If amount is missing, confidence = 0
- If client_name is missing, use "Client" as placeholder, lower confidence
- If due_date is unclear, default to 7 days ago, lower confidence
- Return ONLY valid JSON, no other text

Response format:
{"client_name": "...", "client_email": "...", "client_phone": "...", "amount": 0.00, "due_date": "YYYY-MM-DD", "description": "...", "confidence": 0.0}`;
var EMAIL_EXTRACT_SYSTEM = `You are an invoice data extractor. Analyze forwarded emails to extract invoice information.

Extract:
- client_name: The person/company who sent the invoice (the debtor, NOT the user)
- client_email: Their email address
- amount: Total amount owed
- due_date: Due date in ISO format (YYYY-MM-DD)
- description: Invoice description/service
- invoice_number: If visible

Common patterns:
- User forwards an invoice they SENT to someone \u2192 extract the RECIPIENT as client
- User forwards an invoice they RECEIVED \u2192 they want to chase themselves (rare)
- Look for "Bill To", "To:", invoice tables, amounts

Rules:
- If the forward is unclear, ask a clarifying question in the "error" field
- Return ONLY valid JSON

Response format:
{"client_name": "...", "client_email": "...", "client_phone": null, "amount": 0.00, "due_date": "YYYY-MM-DD", "description": "...", "confidence": 0.0}`;
function getReminderSystem(tone) {
  const toneDescriptions = {
    friendly: 'Warm, casual, and understanding. Assume good intent. Use phrases like "just wanted to check in" and "no worries if you need more time."',
    professional: "Polite but direct. Business-like tone. Clear about the amount and due date without being pushy.",
    firm: "Direct and urgent. Make it clear payment is overdue. Professional but with increasing urgency."
  };
  return `You are a payment reminder writer. Generate a personalized reminder email.

TONE: ${toneDescriptions[tone] || toneDescriptions.professional}

INVOICE DETAILS:
- Client: {client_name}
- Amount: {amount}
- Due Date: {due_date}
- Days Overdue: {days_overdue}
- Description: {description}
- Reminder Number: {reminder_number} (of 4)
- User Business Name: {business_name}

RULES:
1. Keep it under 150 words
2. Include the exact amount and due date
3. Never sound threatening or aggressive
4. Mention what the service/product was if description is provided
5. For reminders 3-4, mention that this is a follow-up
6. DO NOT make up payment terms, legal threats, or consequences
7. Include a payment link placeholder: {{PAYMENT_LINK}}

Generate two fields:
- subject: Email subject line (keep under 60 chars)
- body: HTML email body (use simple inline styles, mobile-friendly)

Response format (JSON only):
{"subject": "...", "body": "..."}`;
}
__name(getReminderSystem, "getReminderSystem");
var REPLY_HANDLER_SYSTEM = `You are a payment collection assistant. Analyze client replies and determine the appropriate response.

INVOICE CONTEXT:
- Client: {client_name}
- Amount: {amount}
- Due Date: {due_date}
- Days Overdue: {days_overdue}
- Reminder Count: {reminder_count}

CLIENT'S MESSAGE:
{client_message}

Analyze the message and determine:
1. intent: What does the client want?
   - "promised_payment" - Says they will pay (extract date if mentioned)
   - "partial_payment" - Wants to pay part now
   - "dispute" - Disputes the invoice or amount
   - "request_extension" - Asks for more time
   - "already_paid" - Claims they already paid
   - "question" - Has a question about the invoice
   - "hostile" - Angry or threatening
   - "other" - Something else

2. response: A brief, professional reply to send back (under 100 words)
3. action: What should NudgePay do?
   - "wait" - Pause reminders, wait for promised date
   - "resume" - Continue normal reminder schedule
   - "escalate" - Send more urgent reminders
   - "pause" - Stop reminders, alert the user
   - "mark_paid" - Client confirms payment was made
4. promised_date: If they promised a payment date, extract it (ISO format)
5. alert_user: true if the user (NudgePay customer) should be notified about this reply

Response format (JSON only):
{"intent": "...", "response": "...", "action": "...", "promised_date": null, "alert_user": false}`;
var SMS_COMMAND_SYSTEM = `You are a command parser for a payment tracking app. Parse user SMS commands.

USER'S MESSAGE: {message}

Determine the command:
1. "paid" - User marks an invoice as paid (extract client name if mentioned)
2. "pause" - Pause chasing for a client
3. "resume" - Resume chasing for a client
4. "status" - Check status of invoices
5. "help" - User needs help
6. "invoice" - This is a new invoice to create (NOT a command)
7. "stop" - Opt out of SMS
8. "start" - Opt back in

If "paid", "pause", or "resume", extract which client/invoice if identifiable.

Response format (JSON only):
{"command": "...", "client_name": null, "confidence": 0.0}`;

// src/ai/client.ts
async function chat(env, messages, model = "anthropic/claude-3.5-haiku") {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://nudgepay.com",
      "X-Title": "NudgePay"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1e3
    })
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("OpenRouter error:", data);
    throw new Error(`AI request failed: ${data.error?.message || "Unknown error"}`);
  }
  return data.choices[0].message.content;
}
__name(chat, "chat");
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
  }
  const match2 = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match2) {
    try {
      return JSON.parse(match2[1].trim());
    } catch {
    }
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
    }
  }
  throw new Error(`Failed to parse AI response: ${text.slice(0, 200)}`);
}
__name(extractJSON, "extractJSON");
async function parseSMSInvoice(env, message) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const system = SMS_PARSE_SYSTEM.replace("{today}", today);
  const response = await chat(env, [
    { role: "system", content: system },
    { role: "user", content: message }
  ]);
  const parsed = extractJSON(response);
  return {
    client_name: parsed.client_name || "Client",
    client_email: parsed.client_email || null,
    client_phone: parsed.client_phone || null,
    amount: parseFloat(parsed.amount) || 0,
    due_date: parsed.due_date || today,
    description: parsed.description || null,
    confidence: parseFloat(parsed.confidence) || 0.5
  };
}
__name(parseSMSInvoice, "parseSMSInvoice");
async function parseEmailInvoice(env, emailBody, emailSubject) {
  const response = await chat(env, [
    { role: "system", content: EMAIL_EXTRACT_SYSTEM },
    { role: "user", content: `Subject: ${emailSubject}

Body:
${emailBody.slice(0, 3e3)}` }
  ]);
  const parsed = extractJSON(response);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return {
    client_name: parsed.client_name || "Client",
    client_email: parsed.client_email || null,
    client_phone: parsed.client_phone || null,
    amount: parseFloat(parsed.amount) || 0,
    due_date: parsed.due_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    description: parsed.description || null,
    confidence: parseFloat(parsed.confidence) || 0.5
  };
}
__name(parseEmailInvoice, "parseEmailInvoice");
async function generateReminder(env, invoice, reminderNumber, tone, businessName) {
  const dueDate = new Date(invoice.due_date);
  const now = /* @__PURE__ */ new Date();
  const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 864e5));
  const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(invoice.amount);
  const system = getReminderSystem(tone).replace("{client_name}", invoice.client_name).replace("{amount}", formattedAmount).replace("{due_date}", invoice.due_date).replace("{days_overdue}", String(daysOverdue)).replace("{description}", invoice.description || "services").replace("{reminder_number}", String(reminderNumber)).replace("{business_name}", businessName);
  const response = await chat(env, [
    { role: "system", content: system },
    { role: "user", content: `Generate reminder #${reminderNumber} for this invoice.` }
  ]);
  return extractJSON(response);
}
__name(generateReminder, "generateReminder");
async function handleClientReply(env, invoice, clientMessage) {
  const dueDate = new Date(invoice.due_date);
  const now = /* @__PURE__ */ new Date();
  const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 864e5));
  const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(invoice.amount);
  const system = REPLY_HANDLER_SYSTEM.replace("{client_name}", invoice.client_name).replace("{amount}", formattedAmount).replace("{due_date}", invoice.due_date).replace("{days_overdue}", String(daysOverdue)).replace("{reminder_count}", String(invoice.reminder_count)).replace("{client_message}", clientMessage);
  const response = await chat(env, [
    { role: "system", content: system },
    { role: "user", content: clientMessage }
  ]);
  return extractJSON(response);
}
__name(handleClientReply, "handleClientReply");
async function parseSMSCommand(env, message) {
  const system = SMS_COMMAND_SYSTEM.replace("{message}", message);
  const response = await chat(env, [
    { role: "system", content: system },
    { role: "user", content: message }
  ]);
  return extractJSON(response);
}
__name(parseSMSCommand, "parseSMSCommand");

// src/webhooks/twilio.ts
init_stripe();
async function handleTwilioWebhook(env, request) {
  const contentType = request.headers.get("Content-Type") || "";
  let from, body;
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    from = formData.get("From") || "";
    body = formData.get("Body") || "";
  } else {
    const data = await request.json();
    from = data.From || "";
    body = data.Body || "";
  }
  if (!from || !body) {
    return twimlResponse("Missing From or Body");
  }
  const phone = from.replace(/\D/g, "");
  const user = await env.DB.prepare("SELECT * FROM users WHERE phone = ?").bind(phone).first();
  if (!user) {
    if (body.includes("@") && body.includes(".")) {
      return twimlResponse(
        "Welcome to NudgePay! \u{1F389} To get started, please sign up at https://nudgepay.com - we'll send you a login link to your email. Then link your phone number in settings."
      );
    }
    const invoice = await env.DB.prepare(`
      SELECT i.*, u.email as user_email, u.id as user_id
      FROM invoices i
      JOIN users u ON u.id = i.user_id
      WHERE i.client_phone = ? AND i.status = 'outstanding'
      ORDER BY i.created_at DESC LIMIT 1
    `).bind(phone).first();
    if (invoice) {
      return handleDebtorReply(env, invoice, body);
    }
    return twimlResponse(
      "Hi! This is NudgePay. To start chasing invoices, sign up at https://nudgepay.com"
    );
  }
  const upperBody = body.toUpperCase().trim();
  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(upperBody)) {
    await env.DB.prepare("UPDATE users SET sms_notifications = 0 WHERE id = ?").bind(user.id).run();
    return twimlResponse("You've been unsubscribed from NudgePay SMS. Text START to re-enable.");
  }
  if (["START", "YES", "UNSTOP"].includes(upperBody)) {
    await env.DB.prepare("UPDATE users SET sms_notifications = 1 WHERE id = ?").bind(user.id).run();
    return twimlResponse("Welcome back! NudgePay SMS is now enabled. Send me invoice details to start chasing.");
  }
  if (upperBody === "HELP") {
    return twimlResponse(
      'NudgePay Commands:\n\u2022 Send invoice details: "$500 from John, john@email.com, due last week"\n\u2022 Mark paid: "John paid" or "paid John"\n\u2022 Check status: "status"\n\u2022 Pause chasing: "pause John"\n\u2022 Dashboard: nudgepay.com/dashboard'
    );
  }
  try {
    const command = await parseSMSCommand(env, body);
    if (command.command === "status") {
      const invoices = await env.DB.prepare(`
        SELECT client_name, amount, status, due_date
        FROM invoices WHERE user_id = ? AND status = 'outstanding'
        ORDER BY due_date ASC LIMIT 5
      `).bind(user.id).all();
      if (invoices.results.length === 0) {
        return twimlResponse("No outstanding invoices! \u{1F389}");
      }
      const lines = invoices.results.map((inv) => {
        const daysOverdue = Math.max(0, Math.floor(
          (Date.now() - new Date(inv.due_date).getTime()) / 864e5
        ));
        const overdueTag = daysOverdue > 0 ? ` (${daysOverdue}d overdue)` : "";
        return `\u2022 ${inv.client_name}: $${inv.amount}${overdueTag}`;
      });
      return twimlResponse(`Outstanding invoices:
${lines.join("\n")}`);
    }
    if (command.command === "paid" && command.client_name) {
      const result = await env.DB.prepare(`
        UPDATE invoices SET status = 'paid', paid_at = datetime('now'), next_reminder_at = NULL
        WHERE user_id = ? AND client_name LIKE ? AND status = 'outstanding'
      `).bind(user.id, `%${command.client_name}%`).run();
      if (result.meta.changes > 0) {
        return twimlResponse(`\u2705 Marked ${command.client_name}'s invoice as paid! Nice work.`);
      } else {
        return twimlResponse(`Couldn't find an outstanding invoice for "${command.client_name}". Check your dashboard.`);
      }
    }
    if (command.command === "pause" && command.client_name) {
      await env.DB.prepare(`
        UPDATE invoices SET status = 'paused', next_reminder_at = NULL
        WHERE user_id = ? AND client_name LIKE ? AND status = 'outstanding'
      `).bind(user.id, `%${command.client_name}%`).run();
      return twimlResponse(`\u23F8 Paused chasing for ${command.client_name}.`);
    }
    if (command.command === "resume" && command.client_name) {
      await env.DB.prepare(`
        UPDATE invoices SET status = 'outstanding', next_reminder_at = datetime('now')
        WHERE user_id = ? AND client_name LIKE ? AND status = 'paused'
      `).bind(user.id, `%${command.client_name}%`).run();
      return twimlResponse(`\u25B6\uFE0F Resumed chasing for ${command.client_name}.`);
    }
    if (command.confidence > 0.7 && command.command !== "invoice") {
      return twimlResponse(`Sorry, I didn't understand that. Text HELP for commands or send invoice details like "$500 from John, john@email.com"`);
    }
  } catch (e) {
    console.error("Command parsing error:", e);
  }
  try {
    const parsed = await parseSMSInvoice(env, body);
    if (parsed.confidence < 0.3 || parsed.amount <= 0) {
      return twimlResponse(
        `I couldn't quite understand that. Try:
"$500 from John, john@email.com, due last week"
Or text HELP for more options.`
      );
    }
    const planLimits = { free: 5, starter: 50, pro: Infinity };
    const limit = planLimits[user.plan] || 5;
    if (user.invoices_used >= limit) {
      return twimlResponse(
        `You've reached your ${user.plan} plan limit (${limit} invoices). Upgrade at nudgepay.com/settings`
      );
    }
    const id = generateId();
    let paymentLink = null;
    try {
      if (user.stripe_customer_id) {
        paymentLink = await createStripePaymentLink(env, parsed.amount, parsed.description || "Invoice");
      }
    } catch (e) {
      console.error("Payment link creation failed:", e);
    }
    const dueDate = new Date(parsed.due_date);
    const now = /* @__PURE__ */ new Date();
    const nextReminder = dueDate < now ? now.toISOString() : new Date(dueDate.getTime() + 864e5).toISOString();
    await env.DB.prepare(`
      INSERT INTO invoices (id, user_id, client_name, client_email, client_phone, amount, due_date, description, source, payment_link, next_reminder_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sms', ?, ?)
    `).bind(
      id,
      user.id,
      parsed.client_name,
      parsed.client_email,
      parsed.client_phone || phone,
      parsed.amount,
      parsed.due_date,
      parsed.description,
      paymentLink,
      nextReminder
    ).run();
    await env.DB.prepare("UPDATE users SET invoices_used = invoices_used + 1 WHERE id = ?").bind(user.id).run();
    const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parsed.amount);
    return twimlResponse(
      `Got it! \u{1F4DD}
\u2022 ${parsed.client_name}: ${formattedAmount}
\u2022 Due: ${parsed.due_date}
\u2022 I'll start chasing them right away!

Reply "${parsed.client_name} paid" when they pay.`
    );
  } catch (e) {
    console.error("Invoice parsing error:", e);
    return twimlResponse(
      'Sorry, I had trouble understanding that. Try:\n"$500 from John, john@email.com, due last week"'
    );
  }
}
__name(handleTwilioWebhook, "handleTwilioWebhook");
async function handleDebtorReply(env, invoice, message) {
  try {
    await env.DB.prepare(`
      INSERT INTO conversations (invoice_id, user_id, role, message, channel)
      VALUES (?, ?, 'client', ?, 'sms')
    `).bind(invoice.id, invoice.user_id, message).run();
    const result = await handleClientReply(env, {
      client_name: invoice.client_name,
      amount: invoice.amount,
      due_date: invoice.due_date,
      reminder_count: invoice.reminder_count
    }, message);
    await env.DB.prepare(`
      INSERT INTO conversations (invoice_id, user_id, role, message, channel)
      VALUES (?, ?, 'ai', ?, 'sms')
    `).bind(invoice.id, invoice.user_id, result.response).run();
    if (result.action === "wait" && result.promised_date) {
      await env.DB.prepare(`
        UPDATE invoices SET next_reminder_at = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(result.promised_date, invoice.id).run();
    } else if (result.action === "pause") {
      await env.DB.prepare(`
        UPDATE invoices SET next_reminder_at = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).bind(invoice.id).run();
    } else if (result.action === "mark_paid") {
      await env.DB.prepare(`
        UPDATE invoices SET status = 'paid', paid_at = datetime('now'), next_reminder_at = NULL
        WHERE id = ?
      `).bind(invoice.id).run();
    }
    if (result.alert_user) {
      const user = await env.DB.prepare("SELECT email, display_name FROM users WHERE id = ?").bind(invoice.user_id).first();
      if (user?.email) {
        await notifyUser(
          env,
          user.email,
          `${invoice.client_name} replied about their invoice`,
          `
            <p><strong>${invoice.client_name}</strong> replied about their
            <strong>$${invoice.amount}</strong> invoice:</p>
            <blockquote style="border-left: 3px solid #6366f1; padding-left: 12px; color: #555;">
              ${message}
            </blockquote>
            <p><strong>AI Response:</strong> ${result.response}</p>
            <p><strong>Recommended Action:</strong> ${result.action}</p>
          `
        );
      }
    }
    return twimlResponse(result.response);
  } catch (e) {
    console.error("Debtor reply handling error:", e);
    return twimlResponse(
      "Thanks for your message. The invoice holder has been notified and will get back to you."
    );
  }
}
__name(handleDebtorReply, "handleDebtorReply");
function twimlResponse(message) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" }
  });
}
__name(twimlResponse, "twimlResponse");
function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(escapeXml, "escapeXml");

// src/webhooks/email.ts
async function handleEmailWebhook(env, request) {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    let from, to, subject, body;
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      from = formData.get("from") || "";
      to = formData.get("to") || "";
      subject = formData.get("subject") || "";
      body = formData.get("text") || formData.get("html") || "";
    } else {
      const data = await request.json();
      from = data.from || "";
      to = data.to || "";
      subject = data.subject || "";
      body = data.text || data.html || "";
    }
    if (!from || !body) {
      return new Response(JSON.stringify({ error: "Missing from or body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const senderEmail = extractEmail(from);
    if (!senderEmail) {
      return new Response(JSON.stringify({ error: "Invalid sender email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(senderEmail).first();
    if (user && (subject.toLowerCase().includes("fw:") || subject.toLowerCase().includes("fwd:"))) {
      return handleForwardedInvoice(env, user, subject, body);
    }
    const invoice = await env.DB.prepare(`
      SELECT i.*, u.email as user_email, u.id as user_id
      FROM invoices i
      JOIN users u ON u.id = i.user_id
      WHERE i.client_email = ? AND i.status = 'outstanding'
      ORDER BY i.created_at DESC LIMIT 1
    `).bind(senderEmail).first();
    if (invoice) {
      return handleEmailReply(env, invoice, subject, body);
    }
    return new Response(JSON.stringify({ received: true, action: "ignored" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Email webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleEmailWebhook, "handleEmailWebhook");
async function handleForwardedInvoice(env, user, subject, body) {
  try {
    const parsed = await parseEmailInvoice(env, body, subject);
    if (parsed.confidence < 0.3 || parsed.amount <= 0) {
      await notifyUser(
        env,
        user.email,
        "Couldn't parse forwarded invoice",
        `
          <p>We had trouble extracting invoice details from your forwarded email.</p>
          <p>You can add the invoice manually at
          <a href="${env.FRONTEND_URL}/dashboard">your dashboard</a>, or text us the details:</p>
          <p><code>$${parsed.amount || "XXX"} from [name], [email], due [date]</code></p>
        `
      );
      return new Response(JSON.stringify({ error: "Could not parse invoice" }), {
        status: 422,
        headers: { "Content-Type": "application/json" }
      });
    }
    const planLimits = { free: 5, starter: 50, pro: Infinity };
    const limit = planLimits[user.plan] || 5;
    if (user.invoices_used >= limit) {
      await notifyUser(
        env,
        user.email,
        "Invoice limit reached",
        `
          <p>You've reached your ${user.plan} plan limit of ${limit} invoices.</p>
          <p><a href="${env.FRONTEND_URL}/settings">Upgrade your plan</a> to add more invoices.</p>
        `
      );
      return new Response(JSON.stringify({ error: "Plan limit reached" }), {
        status: 402,
        headers: { "Content-Type": "application/json" }
      });
    }
    const id = generateId();
    const dueDate = new Date(parsed.due_date);
    const now = /* @__PURE__ */ new Date();
    const nextReminder = dueDate < now ? now.toISOString() : new Date(dueDate.getTime() + 864e5).toISOString();
    await env.DB.prepare(`
      INSERT INTO invoices (id, user_id, client_name, client_email, client_phone, amount, due_date, description, source, next_reminder_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'email', ?)
    `).bind(
      id,
      user.id,
      parsed.client_name,
      parsed.client_email,
      parsed.client_phone,
      parsed.amount,
      parsed.due_date,
      parsed.description,
      nextReminder
    ).run();
    await env.DB.prepare("UPDATE users SET invoices_used = invoices_used + 1 WHERE id = ?").bind(user.id).run();
    const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parsed.amount);
    await notifyUser(
      env,
      user.email,
      `New invoice added: ${parsed.client_name} - ${formattedAmount}`,
      `
        <p>We've added a new invoice and started chasing:</p>
        <ul>
          <li><strong>Client:</strong> ${parsed.client_name}</li>
          <li><strong>Amount:</strong> ${formattedAmount}</li>
          <li><strong>Due:</strong> ${parsed.due_date}</li>
          ${parsed.description ? `<li><strong>Description:</strong> ${parsed.description}</li>` : ""}
        </ul>
        <p>We'll send reminders automatically. Reply "paid" when they pay.</p>
      `
    );
    return new Response(JSON.stringify({ success: true, invoice_id: id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Forwarded invoice error:", error);
    return new Response(JSON.stringify({ error: "Failed to process" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleForwardedInvoice, "handleForwardedInvoice");
async function handleEmailReply(env, invoice, subject, body) {
  try {
    await env.DB.prepare(`
      INSERT INTO conversations (invoice_id, user_id, role, message, channel)
      VALUES (?, ?, 'client', ?, 'email')
    `).bind(invoice.id, invoice.user_id, `${subject}

${body}`).run();
    const result = await handleClientReply(env, {
      client_name: invoice.client_name,
      amount: invoice.amount,
      due_date: invoice.due_date,
      reminder_count: invoice.reminder_count
    }, `${subject}

${body}`);
    await env.DB.prepare(`
      INSERT INTO conversations (invoice_id, user_id, role, message, channel)
      VALUES (?, ?, 'ai', ?, 'email')
    `).bind(invoice.id, invoice.user_id, result.response).run();
    if (result.action === "wait" && result.promised_date) {
      await env.DB.prepare(`
        UPDATE invoices SET next_reminder_at = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(result.promised_date, invoice.id).run();
    } else if (result.action === "pause") {
      await env.DB.prepare(`
        UPDATE invoices SET next_reminder_at = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).bind(invoice.id).run();
    } else if (result.action === "mark_paid") {
      await env.DB.prepare(`
        UPDATE invoices SET status = 'paid', paid_at = datetime('now'), next_reminder_at = NULL
        WHERE id = ?
      `).bind(invoice.id).run();
    }
    if (result.alert_user) {
      await notifyUser(
        env,
        invoice.user_email,
        `${invoice.client_name} replied about their invoice`,
        `
          <p><strong>${invoice.client_name}</strong> replied about their
          <strong>$${invoice.amount}</strong> invoice:</p>
          <blockquote style="border-left: 3px solid #6366f1; padding-left: 12px; color: #555;">
            ${body.slice(0, 500)}
          </blockquote>
          <p><strong>AI Response:</strong> ${result.response}</p>
          <p><strong>Recommended Action:</strong> ${result.action}</p>
        `
      );
    }
    return new Response(JSON.stringify({ success: true, action: result.action }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Email reply error:", error);
    return new Response(JSON.stringify({ error: "Failed to process reply" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleEmailReply, "handleEmailReply");
function extractEmail(from) {
  const match2 = from.match(/<([^>]+)>/) || from.match(/([^\s]+@[^\s]+)/);
  return match2 ? match2[1].toLowerCase().trim() : null;
}
__name(extractEmail, "extractEmail");

// src/webhooks/stripe.ts
async function handleStripeWebhook(env, request) {
  const signature = request.headers.get("Stripe-Signature");
  const body = await request.text();
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const plan = session.amount_total === 2900 ? "starter" : "pro";
      await env.DB.prepare(`
        UPDATE users SET plan = ?, stripe_customer_id = ?, updated_at = datetime('now')
        WHERE stripe_customer_id = ? OR id IN (
          SELECT id FROM users WHERE email = ?
        )
      `).bind(plan, customerId, customerId, session.customer_email || "").run();
      console.log(`Subscription activated: ${customerId} -> ${plan}`);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      let plan = "free";
      if (subscription.status === "active") {
        const priceId = subscription.items?.data?.[0]?.price?.id;
        plan = priceId?.includes("pro") ? "pro" : "starter";
      }
      await env.DB.prepare(`
        UPDATE users SET plan = ?, updated_at = datetime('now')
        WHERE stripe_customer_id = ?
      `).bind(plan, customerId).run();
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      await env.DB.prepare(`
        UPDATE users SET plan = 'free', updated_at = datetime('now')
        WHERE stripe_customer_id = ?
      `).bind(customerId).run();
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      console.log(`Subscription payment succeeded: ${customerId}`);
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};
      if (metadata.invoice_id) {
        const invoice = await env.DB.prepare(`
          UPDATE invoices SET status = 'paid', paid_at = datetime('now'), next_reminder_at = NULL
          WHERE id = ? RETURNING *
        `).bind(metadata.invoice_id).first();
        if (invoice) {
          const user = await env.DB.prepare("SELECT email FROM users WHERE id = ?").bind(invoice.user_id).first();
          if (user?.email) {
            await notifyUser(
              env,
              user.email,
              `\u{1F389} ${invoice.client_name} paid their invoice!`,
              `
                <p style="font-size: 24px; text-align: center;">\u{1F389}</p>
                <p><strong>${invoice.client_name}</strong> just paid their
                <strong>$${invoice.amount}</strong> invoice!</p>
                <p>Payment received via Stripe. No further action needed.</p>
              `
            );
          }
        }
      }
      break;
    }
  }
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleStripeWebhook, "handleStripeWebhook");

// src/webhooks/stripe-connect.ts
async function handleStripeConnectWebhook(env, request) {
  const body = await request.text();
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
  switch (event.type) {
    case "account.updated": {
      const account = event.data.object;
      const accountId = account.id;
      if (account.charges_enabled) {
        const result = await env.DB.prepare(
          `UPDATE users SET stripe_onboarded = 1, updated_at = datetime('now')
           WHERE stripe_account_id = ?`
        ).bind(accountId).run();
        if (result.meta.changes > 0) {
          const user = await env.DB.prepare(
            "SELECT email FROM users WHERE stripe_account_id = ?"
          ).bind(accountId).first();
          if (user?.email) {
            await notifyUser(
              env,
              user.email,
              "Your Stripe account is connected!",
              `
                <p>Your Stripe account is now fully connected to NudgePay. \u{1F389}</p>
                <p>Invoice payments will be deposited directly into your Stripe account.
                NudgePay retains a 1% platform fee on each payment.</p>
                <p><a href="${env.FRONTEND_URL}/settings">View your settings</a></p>
              `
            );
          }
          console.log(`Stripe Connect onboarding complete for account: ${accountId}`);
        }
      } else if (account.requirements?.disabled_reason) {
        await env.DB.prepare(
          `UPDATE users SET stripe_onboarded = 0, updated_at = datetime('now')
           WHERE stripe_account_id = ?`
        ).bind(accountId).run();
        console.warn(`Stripe account disabled: ${accountId}, reason: ${account.requirements.disabled_reason}`);
      }
      break;
    }
  }
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleStripeConnectWebhook, "handleStripeConnectWebhook");

// src/utils/twilio.ts
async function sendSMS(env, to, body) {
  try {
    const cleanNumber = to.replace(/[\s()-]/g, "");
    const formattedTo = cleanNumber.startsWith("+") ? cleanNumber : `+${cleanNumber}`;
    const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          From: env.TWILIO_PHONE_NUMBER,
          To: formattedTo,
          Body: body
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("Twilio SMS error:", data);
      return { success: false, error: data.message || "Failed to send SMS" };
    }
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}
__name(sendSMS, "sendSMS");

// src/cron/daily-chase.ts
var ESCALATION_LEVELS = [1, 1, 2, 2, 3, 3, 4];
async function runDailyChase(env) {
  const stats = { sent: 0, errors: 0, skipped: 0 };
  const now = /* @__PURE__ */ new Date();
  const invoices = await env.DB.prepare(`
    SELECT i.*, u.email as user_email, u.display_name as user_name,
           u.timezone, u.sms_notifications, u.plan,
           us.tone, us.chase_frequency_days, us.quiet_hours_start, us.quiet_hours_end
    FROM invoices i
    JOIN users u ON u.id = i.user_id
    JOIN user_settings us ON us.user_id = u.id
    WHERE i.status = 'outstanding'
      AND i.next_reminder_at IS NOT NULL
      AND i.next_reminder_at <= datetime('now')
    ORDER BY i.next_reminder_at ASC
  `).all();
  console.log(`Chase job: ${invoices.results.length} invoices to process`);
  for (const invoice of invoices.results) {
    try {
      const userTime = getUserTime(now, invoice.timezone);
      const hour = userTime.getHours();
      if (hour >= invoice.quiet_hours_start || hour < invoice.quiet_hours_end) {
        const nextHour = invoice.quiet_hours_end;
        const nextRun = new Date(userTime);
        nextRun.setHours(nextHour, 0, 0, 0);
        if (nextRun <= userTime) nextRun.setDate(nextRun.getDate() + 1);
        await env.DB.prepare("UPDATE invoices SET next_reminder_at = ? WHERE id = ?").bind(nextRun.toISOString(), invoice.id).run();
        stats.skipped++;
        continue;
      }
      const reminderNumber = invoice.reminder_count + 1;
      const level = ESCALATION_LEVELS[Math.min(invoice.reminder_count, ESCALATION_LEVELS.length - 1)];
      if (reminderNumber > 5) {
        await sendEmail(env, {
          to: invoice.user_email,
          subject: `Stopped chasing ${invoice.client_name} - max reminders reached`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
              <h2>We've stopped chasing ${invoice.client_name}</h2>
              <p>After 5 reminders, we've paused chasing their <strong>$${invoice.amount}</strong> invoice.</p>
              <p>You may need to take alternative action (phone call, collections, etc.)</p>
              <p><a href="${env.FRONTEND_URL}/dashboard">View Dashboard</a></p>
            </div>
          `
        });
        await env.DB.prepare(`
          UPDATE invoices SET status = 'paused', next_reminder_at = NULL WHERE id = ?
        `).bind(invoice.id).run();
        stats.skipped++;
        continue;
      }
      const reminder = await generateReminder(env, {
        client_name: invoice.client_name,
        amount: invoice.amount,
        due_date: invoice.due_date,
        description: invoice.description
      }, reminderNumber, invoice.tone, invoice.user_name || "a valued client");
      let emailBody = reminder.body;
      if (invoice.payment_link) {
        emailBody = emailBody.replace(
          "{{PAYMENT_LINK}}",
          `<a href="${invoice.payment_link}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Pay Now</a>`
        );
      } else {
        emailBody = emailBody.replace("{{PAYMENT_LINK}}", "");
      }
      let emailSent = false;
      if (invoice.client_email) {
        const replyTo = `reply+${invoice.id}@nudgepay.com`;
        const result = await sendEmail(env, {
          to: invoice.client_email,
          subject: reminder.subject,
          html: emailBody,
          replyTo
        });
        emailSent = result.success;
        await env.DB.prepare(`
          INSERT INTO reminders (id, invoice_id, user_id, channel, level, subject, body)
          VALUES (?, ?, ?, 'email', ?, ?, ?)
        `).bind(generateId(), invoice.id, invoice.user_id, level, reminder.subject, emailBody).run();
      }
      if (invoice.client_phone && invoice.sms_notifications && reminderNumber >= 2) {
        const smsBody = `Hi ${invoice.client_name}, just a friendly reminder that your invoice for $${invoice.amount} from ${invoice.due_date} is still outstanding. ${invoice.payment_link ? `Pay here: ${invoice.payment_link}` : "Please let us know if you have any questions."}`;
        try {
          await sendSMS(env, invoice.client_phone, smsBody);
          await env.DB.prepare(`
            INSERT INTO reminders (id, invoice_id, user_id, channel, level, body)
            VALUES (?, ?, ?, 'sms', ?, ?)
          `).bind(generateId(), invoice.id, invoice.user_id, level, smsBody).run();
        } catch (e) {
          console.error(`SMS failed for invoice ${invoice.id}:`, e);
        }
      }
      const frequencyDays = invoice.chase_frequency_days.split(",").map(Number);
      const nextIndex = Math.min(reminderNumber, frequencyDays.length - 1);
      const nextDays = frequencyDays[nextIndex];
      const nextReminder = new Date(now.getTime() + nextDays * 864e5).toISOString();
      await env.DB.prepare(`
        UPDATE invoices
        SET reminder_count = reminder_count + 1,
            last_reminder_at = datetime('now'),
            next_reminder_at = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(nextReminder, invoice.id).run();
      if (emailSent) {
        stats.sent++;
      } else {
        stats.errors++;
      }
    } catch (error) {
      console.error(`Error processing invoice ${invoice.id}:`, error);
      stats.errors++;
    }
  }
  console.log(`Chase job complete: ${stats.sent} sent, ${stats.errors} errors, ${stats.skipped} skipped`);
  return stats;
}
__name(runDailyChase, "runDailyChase");
function getUserTime(utcDate, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const parts = formatter.formatToParts(utcDate);
    const get = /* @__PURE__ */ __name((type) => parts.find((p) => p.type === type)?.value || "0", "get");
    return /* @__PURE__ */ new Date(
      `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
    );
  } catch {
    return utcDate;
  }
}
__name(getUserTime, "getUserTime");

// src/index.ts
var app = new Hono2();
app.use("*", cors({
  origin: ["http://localhost:3000", "https://nudgepay.com", "https://*.nudgepay.com", "https://nudgepay.pages.dev", "https://*.nudgepay.pages.dev"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.get("/", (c) => c.json({ status: "ok", service: "NudgePay API", version: "0.1.0" }));
app.post("/auth/magic-link", async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: "Email required" }, 400);
  const result = await sendMagicLink(c.env, email);
  if (!result.success) return c.json({ error: result.error }, 400);
  return c.json({ success: true, message: "Check your email for a login link" });
});
app.get("/auth/verify", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Token required" }, 400);
  const result = await verifyMagicLink(c.env, token);
  if (!result.success) return c.json({ error: result.error }, 401);
  const dashboardUrl = `${c.env.FRONTEND_URL}/dashboard?token=${result.token}`;
  return c.redirect(dashboardUrl);
});
app.post("/auth/verify", async (c) => {
  const { token } = await c.req.json();
  if (!token) return c.json({ error: "Token required" }, 400);
  const result = await verifyMagicLink(c.env, token);
  if (!result.success) return c.json({ error: result.error }, 401);
  return c.json({ success: true, token: result.token });
});
app.get("/api/invoices", (c) => listInvoices(c.env, c.req.raw));
app.post("/api/invoices", (c) => createInvoice(c.env, c.req.raw));
app.get("/api/invoices/:id", (c) => getInvoice(c.env, c.req.raw));
app.patch("/api/invoices/:id", (c) => updateInvoice(c.env, c.req.raw));
app.delete("/api/invoices/:id", (c) => deleteInvoice(c.env, c.req.raw));
app.get("/api/stats", (c) => getStats(c.env, c.req.raw));
app.get("/api/settings", (c) => getSettings(c.env, c.req.raw));
app.patch("/api/settings", (c) => updateSettings(c.env, c.req.raw));
app.post("/webhook/twilio", async (c) => handleTwilioWebhook(c.env, c.req.raw));
app.post("/webhook/email", async (c) => handleEmailWebhook(c.env, c.req.raw));
app.post("/webhook/stripe", async (c) => handleStripeWebhook(c.env, c.req.raw));
app.post("/webhook/stripe-connect", async (c) => handleStripeConnectWebhook(c.env, c.req.raw));
app.post("/api/billing/checkout", async (c) => {
  const user = await getUserFromRequest(c.env, c.req.raw);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { plan } = await c.req.json();
  const priceId = plan === "pro" ? "price_pro_monthly" : "price_starter_monthly";
  const { createCheckoutSession: createCheckoutSession2, STRIPE_PRICES: STRIPE_PRICES2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
  const url = await createCheckoutSession2(
    c.env,
    user.stripe_customer_id,
    STRIPE_PRICES2[plan] || priceId,
    `${c.env.FRONTEND_URL}/dashboard?upgraded=true`,
    `${c.env.FRONTEND_URL}/settings`
  );
  return c.json({ url });
});
app.post("/api/billing/connect", async (c) => {
  const user = await getUserFromRequest(c.env, c.req.raw);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { createConnectAccount: createConnectAccount2, createAccountLink: createAccountLink2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
  let accountId = user.stripe_account_id;
  if (!accountId) {
    accountId = await createConnectAccount2(c.env, user.email);
    await c.env.DB.prepare(
      `UPDATE users SET stripe_account_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(accountId, user.id).run();
  }
  const url = await createAccountLink2(c.env, accountId, user.id);
  return c.json({ url });
});
app.get("/api/billing/connect/status", async (c) => {
  const user = await getUserFromRequest(c.env, c.req.raw);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.stripe_account_id) {
    return c.json({ connected: false, onboarded: false, account_id: null });
  }
  const response = await fetch(
    `https://api.stripe.com/v1/accounts/${user.stripe_account_id}`,
    { headers: { Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}` } }
  );
  const account = await response.json();
  const onboarded = account.charges_enabled === true;
  if (onboarded && !user.stripe_onboarded) {
    await c.env.DB.prepare(
      `UPDATE users SET stripe_onboarded = 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(user.id).run();
  }
  return c.json({
    connected: true,
    onboarded,
    account_id: user.stripe_account_id,
    payouts_enabled: account.payouts_enabled,
    requirements: account.requirements?.currently_due ?? []
  });
});
app.post("/api/billing/portal", async (c) => {
  const user = await getUserFromRequest(c.env, c.req.raw);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.stripe_customer_id) {
    return c.json({ error: "No active subscription found. Please upgrade first." }, 400);
  }
  const { createPortalSession: createPortalSession2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
  const url = await createPortalSession2(
    c.env,
    user.stripe_customer_id,
    `${c.env.FRONTEND_URL}/dashboard`
  );
  return c.json({ url });
});
app.post("/cron/daily-chase", async (c) => {
  const cronSecret = c.req.header("X-Cron-Secret");
  if (cronSecret && cronSecret !== "nudgepay-cron-secret") {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const stats = await runDailyChase(c.env);
  return c.json(stats);
});
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});
app.notFound((c) => c.json({ error: "Not found" }, 404));
var index_default = {
  fetch: app.fetch,
  // Cron trigger handler
  async scheduled(event, env, ctx) {
    console.log("Cron triggered:", event.cron);
    ctx.waitUntil(runDailyChase(env));
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map