function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization,content-type,x-admin-key",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
}

function withCors(handler) {
  return async (event, context) => {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: corsHeaders(), body: "" };
    }
    const res = await handler(event, context);
    if (!res.headers) res.headers = {};
    Object.assign(res.headers, corsHeaders());
    return res;
  };
}

module.exports = { corsHeaders, withCors };
