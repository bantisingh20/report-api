const quoteField = (field) => {
  // Split the field by '.' to handle the schema, table, and column
  const parts = field.split(".");

  // Ensure that at least two parts exist: schema and table (or schema.table.column)
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(
      'Invalid field format. Expected "schema.table" or "schema.table.column"'
    );
  }

  // Quote each part (schema, table, and column if present)
  const quotedField = parts.map((part) => `"${part}"`).join(".");

  return quotedField;
}
 

// Extract the column name only
const extractLabel = (field) => {
  const parts = field.split(".");
  return parts[parts.length - 1];
};

// Generate filter SQL and parameters
const buildFilterClause = (filters, paramIndexStart = 1) => {
  const params = [];
  let paramIndex = paramIndexStart;

  const clauses = filters.map((filter) => {
    const sqlOperator = filter.operator;

    if (sqlOperator === "between") {
      params.push(filter.valueFrom, filter.valueTo);
      return `${quoteField(filter.field)} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
    } else if (sqlOperator === "ILIKE" || sqlOperator === "contain") {
      params.push(`%${filter.value}%`);
      return `${quoteField(filter.field)} ILIKE $${paramIndex++}`;
    } else {
      params.push(filter.value);
      return `${quoteField(filter.field)} ${sqlOperator} $${paramIndex++}`;
    }
  });

  const whereClause = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  return { whereClause, params };
};

// Generate ORDER BY clause
const buildOrderClause = (sortBy) => {
  if (!Array.isArray(sortBy) || sortBy.length === 0) return "";
  const orderClause = sortBy.map((s) => `${quoteField(s.column)} ${s.order}`);
  return ` ORDER BY ${orderClause.join(", ")}`;
};

// Generate pagination clause
const buildPaginationClause = (paramsLength, page, pageSize) => {
  const offset = (page - 1) * pageSize;
  return {
    clause: ` LIMIT $${paramsLength + 1} OFFSET $${paramsLength + 2}`,
    extraParams: [pageSize, offset],
  };
};

// Build aggregation query for XY Chart
const buildXYAggregation = (xyaxis, fromClause, whereClause, orderByClause) => {
  const xAxisField = xyaxis.x.field;
  const yAxisField = xyaxis.y.field;
  const xAxisDirection = xyaxis.x.order;
  const yAxisAggregation = xyaxis.y.aggregation || "count";
  const transformation = xyaxis.x.transformation;

  let xAxisGroupBy = "";
  if (transformation === "daywise")
    xAxisGroupBy = `DATE_TRUNC('day', ${quoteField(xAxisField)})`;
  else if (transformation === "monthwise")
    xAxisGroupBy = `TO_CHAR(${quoteField(xAxisField)}, 'YYYY-MM')`;
  else if (transformation === "yearwise")
    xAxisGroupBy = `TO_CHAR(${quoteField(xAxisField)}, 'YYYY')`;
  else xAxisGroupBy = quoteField(xAxisField);

  let aggregation = "";
  switch (yAxisAggregation) {
    case "sum":
      aggregation = `SUM(${quoteField(yAxisField)})`;
      break;
    case "average":
      aggregation = `AVG(${quoteField(yAxisField)})`;
      break;
    case "max":
      aggregation = `MAX(${quoteField(yAxisField)})`;
      break;
    case "min":
      aggregation = `MIN(${quoteField(yAxisField)})`;
      break;
    default:
      aggregation = `COUNT(${quoteField(yAxisField)})`;
  }

  const selectFields = `
    ${xAxisGroupBy} AS "xAxis",
    ${aggregation} AS "yAxis"
  `;

  const groupedSQL = `
    SELECT ${selectFields}
    ${fromClause}
    ${whereClause}
    GROUP BY ${xAxisGroupBy}
    ${orderByClause}
  `;

  return { groupedSQL };
};

module.exports = {
  quoteField,
  extractLabel,
  buildFilterClause,
  buildOrderClause,
  buildPaginationClause,
  buildXYAggregation,
};
