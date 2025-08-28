const { withCors } = require("../lib/cors");
const { requireAuth } = require("../lib/auth");
const { sql } = require("../lib/db");

module.exports.handler = withCors(async (event) => {
  const { tenantId } = requireAuth(event);
  const windowParam = (event.queryStringParameters && event.queryStringParameters.window) || "7d";
  const days = windowParam === "30d" ? 30 : 7;

  // compute inclusive day range [start .. today]
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); // today 00:00 UTC
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const rows = await sql`
    with day_series as (
      select generate_series(${start}, ${end}, interval '1 day')::date as day
    )
    select
      d.day::text as day,
      coalesce(count(c.id), 0)::int as total,
      coalesce(round(avg(c.duration_sec)), 0)::int as avg_duration
    from day_series d
    left join calls c
      on c.tenant_id = ${tenantId}
     and date(c.started_at) = d.day
    group by d.day
    order by d.day;
  `;

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rows),
  };
});
