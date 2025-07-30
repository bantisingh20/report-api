/**
 * Normalize field name string from various formats.
 * Accepts either string or object { column_name: '...' }
 */
function normalizeField(field) {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object' && field.column_name) return field.column_name;
  return null;
}

/**
 * Map PostgreSQL data type to JS type string ('string', 'number', 'boolean', etc.)
 * Add more types as needed.
 */
function mapDbTypeToJsType(dbType) {
  const type = dbType.toLowerCase();

  if (['integer', 'bigint', 'smallint', 'decimal', 'numeric', 'real', 'double precision'].includes(type)) {
    return 'number';
  }
  if (['boolean'].includes(type)) {
    return 'boolean';
  }
  if (['date', 'timestamp', 'timestamptz', 'time', 'timetz'].includes(type)) {
    return 'string'; // treat dates as strings for filtering
  }
  // default fallback
  return 'string';
}

/**
 * Validate that required selections are made based on fieldtype
 */
function validateFieldtypeSelection(fieldtype, selectedcolumns, xyaxis) {
  const ft = fieldtype?.toLowerCase();
  if (ft === 'summary' && selectedcolumns.length === 0) {
    return 'Select Column to view in report';
  }
  if (ft === 'count' && xyaxis.length === 0) {
    return 'Select X-Y Axis Configuration to View';
  }
  return null;
}

/**
 * Validate filters array for required fields, operators, and value types.
 * Throws an Error with message if validation fails.
 */
async function validateFilters(filters, columnMap) {
  for (const [i, filter] of filters.entries()) {
    const { operator, value, valueFrom, valueTo } = filter;
    const field = normalizeField(filter.field);

    if (!field || !columnMap.has(field)) {
      throw new Error(`Filter at index ${i}: Invalid or missing field.`);
    }

    if (!operator) {
      throw new Error(`Filter at index ${i}: 'operator' is required.`);
    }

    if (operator === 'between') {
      if (valueFrom == null || valueTo == null) {
        throw new Error(`Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.`);
      }
    } else {
      if (value == null) {
        throw new Error(`Filter at index ${i}: 'value' is required for operator '${operator}'.`);
      }

      const jsValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
      const expectedType = mapDbTypeToJsType(columnMap.get(field));
      let actualType = typeof jsValue;

      if (expectedType === 'string' && actualType === 'number') actualType = 'string';

      if (expectedType !== actualType) {
        throw new Error(`Filter at index ${i}: Type mismatch for "${field}": expected ${expectedType}, got ${actualType}`);
      }
    }
  }
}

/**
 * Validate groupBy and sortBy fields against selected columns and columnMap.
 * Throws error if invalid.
 */
function validateGroupAndSort(fieldtype, selectedcolumns, groupby, sortby, columnMap) {
  const selectedSet = new Set(selectedcolumns);

  const sortFields = sortby.map(col => normalizeField(col.field));
  const badSort = sortFields.filter(field => !columnMap.has(field));
  if (badSort.length > 0) {
    throw new Error(`Invalid sort columns: ${badSort.join(", ")}`);
  }

  const groupFields = groupby.map(col => normalizeField(col.field));
  const missingInSelect = groupFields.filter(field => !selectedSet.has(field));
  if (missingInSelect.length > 0 && fieldtype?.toLowerCase() === 'summary') {
    throw new Error(`Group by columns must be selected: ${missingInSelect.join(", ")}`);
  }

  const badGroup = groupFields.filter(field => !columnMap.has(field));
  if (badGroup.length > 0 && fieldtype?.toLowerCase() === 'summary') {
    throw new Error(`Invalid group columns: ${badGroup.join(", ")}`);
  }
}

module.exports = {
  normalizeField,
  mapDbTypeToJsType,
  validateFieldtypeSelection,
  validateFilters,
  validateGroupAndSort,
};
