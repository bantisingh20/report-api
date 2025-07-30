const pool = require("../config/database.js");
const { Executionfunction, getPaginatedReports, getTotalReportCount, getReportById, insertReportConfiguration,
  updateReportConfiguration,
  getTablesAndViews } = require("../service/report.service.js");
const { FromResult, FromPaginatedResult, MessageType } = require("../middlewares/apiResponse.js");
const { mapDbTypeToJsType } = require("../utils/Operator.utils.js");
const { getPaginationParams, addSerialNumbers } = require("../utils/queryHelper.js");
const { normalizeField, validateFieldtypeSelection, validateFilters, validateGroupAndSort } = require("../utils/validationUtils.js");

require('dotenv').config();


async function ListReport(req, res) {
  try {

    const { page, pageSize, offset } = getPaginationParams(req);
    let data = await getPaginatedReports(pageSize, offset);
    const totalCount = await getTotalReportCount();
    data = addSerialNumbers(data, offset);
    console.log(data);
    return res.json(FromPaginatedResult(MessageType.Success, '', data, page, pageSize, totalCount));
  } catch (error) {
    console.log(error);
    return res.status(500).json(FromResult(MessageType.Error, error.message, [], 0));
  }
}

async function GetReportById(req, res) {
  try {
    const reportId = req.params.id;
    const report = await getReportById(reportId);

    if (!report) {
      return res.status(404).json(FromResult(MessageType.Error, 'Report not found', null, 0));
    }

    res.json(FromResult(MessageType.Success, '', report, 1));
  } catch (error) {
    res.status(500).json(FromResult(MessageType.Error, error.message, null, 0));
  }
}

async function SaveReportConfiguration(req, res) {
  try {
    const {
      reportname,
      userId,
      fieldtype,
      tableandview = [],
      xyaxis = [],
      selectedcolumns = [],
      filters = [],
      sortby = [],
      groupby = []
    } = req.body;

    const reportId = req.params.id;

    if (!reportname) {
      return res.status(400).json(FromResult(MessageType.Error, 'Report name is required', null, 0));
    }

    let savedId;

    if (reportId != 0) {
      savedId = await updateReportConfiguration(reportId, {
        userId,
        reportname,
        tableandview,
        selectedcolumns,
        filters,
        groupby,
        sortby,
        xyaxis,
        fieldtype
      });
    } else {
      savedId = await insertReportConfiguration({
        userId,
        reportname,
        tableandview,
        selectedcolumns,
        filters,
        groupby,
        sortby,
        xyaxis,
        fieldtype
      });
    }

    return res.json(FromResult(MessageType.Success, 'Report saved successfully.', { id: savedId }, 1));
  } catch (err) {
    return res.status(500).json(FromResult(MessageType.Error, err.message, null, 0));
  }
}

async function listTablesAndViews(req, res) {
  try {
    const data = await getTablesAndViews();

    res.json(data);
    return res.json(FromResult(MessageType.Success, '', data));
  } catch (error) {
    return res.status(500).json(FromResult(MessageType.Error, error.message, [], 0));
  }
}

async function CheckRelationAndListOfColumn(req, res) {
  try {
    const { selectedTables = [] } = req.body;

    // Step 1: Split schema.table into { schema, table }
    const tableSchemaPairs = selectedTables.map((full) => {
      const [schema, table] = full.split(".");
      return { schema, table };
    });

    // Step 2: Foreign Key Lookup with schema filtering
    const fkQuery = `
      SELECT
        tc.table_schema AS source_schema,
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_schema AS target_schema,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM 
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' AND
        (
          (tc.table_schema, tc.table_name) IN (${tableSchemaPairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")}) OR
          (ccu.table_schema, ccu.table_name) IN (${tableSchemaPairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
        )
    `;

    const paramValues = tableSchemaPairs.flatMap(({ schema, table }) => [schema, table]);

    const { rows: fkRows } = await pool.query(fkQuery, paramValues);

    // Step 3: Track all related tables (schema.table)
    const relatedTables = new Set(selectedTables); // Add input tables first
    fkRows.forEach(row => {
      relatedTables.add(`${row.source_schema}.${row.source_table}`);
      relatedTables.add(`${row.target_schema}.${row.target_table}`);
    });

    // Step 4: Column metadata query for all related tables
    const relatedPairs = Array.from(relatedTables).map((full) => {
      const [schema, table] = full.split(".");
      return { schema, table };
    });

    const columnQuery = `
      SELECT table_schema, table_name, column_name, data_type
      FROM information_schema.columns
      WHERE (table_schema, table_name) IN (${relatedPairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
    `;

    const columnParams = relatedPairs.flatMap(({ schema, table }) => [schema, table]);
    const { rows: columnRows } = await pool.query(columnQuery, columnParams);

    // Step 5: Organize columns as { "schema.table": [columns] }
    const columnsByTable = {};
    columnRows.forEach(row => {
      const key = `${row.table_schema}.${row.table_name}`;
      if (!columnsByTable[key]) {
        columnsByTable[key] = [];
      }
      columnsByTable[key].push({
        column_name: row.column_name,
        data_type: row.data_type,
      });
    });

    res.json({
      relatedTables: Array.from(relatedTables),
      columnsByTable,
      relations: fkRows.map(row => ({
        from: `${row.source_schema}.${row.source_table}.${row.source_column}`,
        to: `${row.target_schema}.${row.target_table}.${row.target_column}`
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


async function PreviewReportlod(req, res, next) {
  const {
    report_name,
    tableandview = [],
    selectedcolumns = [],
    xyaxis = [],
    filters = [],
    sortby = [],
    groupby = [],
    fieldtype,
  } = req.body;

  console.log(req.body);
  try {
    if (fieldtype?.toLowerCase() === "summary" && selectedcolumns.length === 0) {
      return next({
        status: 400,
        message: `Select Column to view in report`,
        error: "Column validation failed.",
      });
    }

    if (fieldtype?.toLowerCase() === "count" && xyaxis.length === 0) {
      return next({
        status: 400,
        message: `Select X-Y Axis Configuration to View`,
        error: "Column validation failed.",
      });
    }

    // 1. Validate table existence with schema
    const tableSchemas = tableandview.map((full) => {
      const [schema, table] = full.includes(".") ? full.split(".") : ["public", full];
      return { schema, table };
    });

    const tableResult = await pool.query(
      `
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE (table_schema, table_name) IN (${tableSchemas.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
      `,
      tableSchemas.flatMap(({ schema, table }) => [schema, table])
    );

    const foundTables = new Set(
      tableResult.rows.map((row) => `${row.table_schema}.${row.table_name}`)
    );
    const missingTables = tableandview.filter((t) => !foundTables.has(t));

    if (missingTables.length > 0) {
      return next({
        status: 400,
        message: `The following tables/views do not exist: ${missingTables.join(", ")}`,
        error: "Table validation failed.",
      });
    }

    // 2. Check join relationships (foreign keys)
    const allTableNames = tableSchemas.map(({ schema, table }) => `"${schema}"."${table}"`);
    const relResult = await pool.query(
      `
      SELECT
        conrelid::regclass::text AS source_table,
        confrelid::regclass::text AS target_table
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid::regclass::text = ANY($1)
        AND confrelid::regclass::text = ANY($1)
      `,
      [allTableNames]
    );

    const relatedPairs = new Set(
      relResult.rows.map((row) =>
        [row.source_table, row.target_table].sort().join(",")
      )
    );

    if (relatedPairs.size === 0 && tableandview.length > 1) {
      return next({
        status: 400,
        message: `The selected tables/views are not related to each other.`,
        error: "Table relationship validation failed.",
      });
    }

    // 3. Fetch column metadata from all schemas
    const colResult = await pool.query(
      `
      SELECT table_schema, table_name, column_name, data_type
      FROM information_schema.columns
      WHERE (table_schema, table_name) IN (${tableSchemas.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
      `,
      tableSchemas.flatMap(({ schema, table }) => [schema, table])
    );

    const columnMap = new Map();
    colResult.rows.forEach((row) => {
      columnMap.set(`${row.table_schema}.${row.table_name}.${row.column_name}`, row.data_type);
    });

    // 4. Validate selected columns
    const invalidColumns = selectedcolumns.filter((col) => !columnMap.has(col));
    if (invalidColumns.length > 0) {
      return next({
        status: 400,
        message: `Invalid selected columns: ${invalidColumns.join(", ")}`,
        error: "Invalid column selection.",
      });
    }

    // 5. Validate filters
    for (const [i, filter] of filters.entries()) {
      const { operator, value, valueFrom, valueTo } = filter;
      const field = typeof filter.field === "object" ? filter.field.column_name : filter.field;

      if (!field || !columnMap.has(field)) {
        return next({
          status: 400,
          message: `Filter at index ${i}: Invalid or missing field.`,
          error: "Invalid column in filter.",
        });
      }

      if (!operator) {
        return next({
          status: 400,
          message: `Filter at index ${i}: 'operator' is required.`,
          error: "Missing operator.",
        });
      }

      if (operator === "between") {
        if (valueFrom == null || valueTo == null) {
          return next({
            status: 400,
            message: `Filter at index ${i}: 'valueFrom' and 'valueTo' are required for 'between' operator.`,
            error: "Missing range values.",
          });
        }
      } else {
        if (value == null) {
          return next({
            status: 400,
            message: `Filter at index ${i}: 'value' is required for operator '${operator}'.`,
            error: "Missing filter value.",
          });
        }

        const jsValue = typeof value === "string" && !isNaN(Number(value)) ? Number(value) : value;
        const expectedType = await mapDbTypeToJsType(columnMap.get(field));
        let actualType = typeof jsValue;

        if (expectedType === "string" && actualType === "number") actualType = "string";
        if (expectedType !== actualType) {
          return next({
            status: 400,
            message: `Filter at index ${i}: Type mismatch for "${field}": expected ${expectedType}, got ${actualType}`,
            error: "Type mismatch in filter.",
          });
        }
      }
    }

    // 6. Validate sortBy and groupBy
    const selectedSet = new Set(selectedcolumns);

    const sortFields = sortby.map(col => normalizeField(col.field));
    const badSort = sortFields.filter(field => !columnMap.has(field));
    if (badSort.length > 0) {
      return next({
        status: 400,
        message: `Invalid sort columns: ${badSort.join(", ")}`,
        error: "Invalid sort selection.",
      });
    }

    const groupFields = groupby.map(col => normalizeField(col.field));
    const missingInSelect = groupFields.filter(field => !selectedSet.has(field));
    if (missingInSelect.length > 0 && fieldtype?.toLowerCase() === "summary") {
      return next({
        status: 400,
        message: `Group by columns must be selected: ${missingInSelect.join(", ")}`,
        error: "Invalid group selection.",
      });
    }

    const badGroup = groupFields.filter((field) => !columnMap.has(field));
    if (badGroup.length > 0 && fieldtype?.toLowerCase() === "summary") {
      return next({
        status: 400,
        message: `Invalid group columns: ${badGroup.join(", ")}`,
        error: "Invalid group selection.",
      });
    }

    // 7. Build config
    const config = {
      tables: tableandview,
      fieldtype,
      selection: selectedcolumns,
      filters: filters.map((f) => ({
        field: normalizeField(f.field),
        operator: f.operator,
        value: f.value,
        valueFrom: f.valueFrom,
        valueTo: f.valueTo,
      })),
      groupBy: groupby.map((g) => ({
        field: normalizeField(g.field),
      })),
      sortBy: sortby.map((col) => ({
        column: normalizeField(col.field),
        order: col.direction,
      })),
      xyaxis: xyaxis.map((axis) => ({
        x: {
          field: normalizeField(axis.xAxisField),
          order: axis.xAxisDirection,
          transformation: axis.xAxisTransformation || "raw",
        },
        y: {
          field: normalizeField(axis.yAxisField),
          order: axis.yAxisDirection,
          aggregation: axis.yAxisAggregation || "count",
        },
      })),
    };

    console.log(config)

    console.log('okay banti');
    // 8. Execute report
    const data = await Executionfunction(config);

    res.json({ message: "Validation passed", data, chartData: null });
  } catch (err) {
    next(err);
  }
}


async function PreviewReport(req, res, next) {
  const {
    report_name,
    tableandview = [],
    selectedcolumns = [],
    xyaxis = [],
    filters = [],
    sortby = [],
    groupby = [],
    fieldtype,
  } = req.body;

  try {
    // 1. Validate basic fieldtype requirements
    const validationError = validateFieldtypeSelection(fieldtype, selectedcolumns, xyaxis);
    if (validationError) {
      return next({
        status: 400,
        message: validationError,
        error: "Column validation failed.",
      });
    }

    // 2. Validate table existence
    const tableSchemas = tableandview.map(full => {
      const [schema, table] = full.includes('.') ? full.split('.') : ['public', full];
      return { schema, table };
    });

    if (tableSchemas.length === 0) {
      return next({
        status: 400,
        message: "No tables or views specified.",
        error: "Table validation failed."
      });
    }

    const placeholders = tableSchemas.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
    const params = tableSchemas.flatMap(({ schema, table }) => [schema, table]);

    const tableResult = await pool.query(
      `SELECT table_schema, table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (${placeholders})`,
      params
    );

    const foundTables = new Set(tableResult.rows.map(row => `${row.table_schema}.${row.table_name}`));
    const missingTables = tableandview.filter(t => !foundTables.has(t));
    if (missingTables.length > 0) {
      return next({
        status: 400,
        message: `The following tables/views do not exist: ${missingTables.join(", ")}`,
        error: "Table validation failed.",
      });
    }

    // 3. Validate foreign key relationships if multiple tables
    if (tableandview.length > 1) {
      const allTableNames = tableSchemas.map(({ schema, table }) => `"${schema}"."${table}"`);
      const relResult = await pool.query(
        `SELECT conrelid::regclass::text AS source_table, confrelid::regclass::text AS target_table
         FROM pg_constraint
         WHERE contype = 'f'
         AND conrelid::regclass::text = ANY($1)
         AND confrelid::regclass::text = ANY($1)`,
        [allTableNames]
      );

      if (relResult.rows.length === 0) {
        return next({
          status: 400,
          message: "The selected tables/views are not related to each other.",
          error: "Table relationship validation failed.",
        });
      }
    }

    // 4. Fetch column metadata
    const colResult = await pool.query(
      `SELECT table_schema, table_name, column_name, data_type
       FROM information_schema.columns
       WHERE (table_schema, table_name) IN (${placeholders})`,
      params
    );

    const columnMap = new Map();
    colResult.rows.forEach(row => {
      columnMap.set(`${row.table_schema}.${row.table_name}.${row.column_name}`, row.data_type);
    });

    // 5. Validate selected columns
    const invalidColumns = selectedcolumns.filter(col => !columnMap.has(col));
    if (invalidColumns.length > 0) {
      return next({
        status: 400,
        message: `Invalid selected columns: ${invalidColumns.join(", ")}`,
        error: "Invalid column selection.",
      });
    }

    // 6. Validate filters
    try {
      await validateFilters(filters, columnMap);
    } catch (filterError) {
      return next({
        status: 400,
        message: filterError.message,
        error: "Invalid filter.",
      });
    }

    // 7. Validate groupBy and sortBy
    try {
      validateGroupAndSort(fieldtype, selectedcolumns, groupby, sortby, columnMap);
    } catch (groupSortError) {
      return next({
        status: 400,
        message: groupSortError.message,
        error: "Invalid group/sort selection.",
      });
    }

    // 8. Build config for execution
    const config = {
      tables: tableandview,
      fieldtype,
      selection: selectedcolumns,
      filters: filters.map(f => ({
        field: normalizeField(f.field),
        operator: f.operator,
        value: f.value,
        valueFrom: f.valueFrom,
        valueTo: f.valueTo,
      })),
      groupBy: groupby.map(g => ({
        field: normalizeField(g.field),
      })),
      sortBy: sortby.map(col => ({
        column: normalizeField(col.field),
        order: col.direction,
      })),
      xyaxis: xyaxis.map(axis => ({
        x: {
          field: normalizeField(axis.xAxisField),
          order: axis.xAxisDirection,
          transformation: axis.xAxisTransformation || "raw",
        },
        y: {
          field: normalizeField(axis.yAxisField),
          order: axis.yAxisDirection,
          aggregation: axis.yAxisAggregation || "count",
        },
      })),
    };

    // 9. Execute report with the config
    const data = await Executionfunction(config);

    res.json({ message: "Validation passed", data, chartData: null });

  } catch (err) {
    next(err);
  }
}

 async function validatePreviewRequest(req, res, next) {
  const {
    report_name,
    tableandview = [],
    selectedcolumns = [],
    xyaxis = [],
    filters = [],
    sortby = [],
    groupby = [],
    fieldtype,
  } = req.body;

  try {
    const validationError = validateFieldtypeSelection(fieldtype, selectedcolumns, xyaxis);
    if (validationError) {
      return res.status(400).json({
        message: validationError,
        error: "Column validation failed",
      });
    }

    const tableSchemas = tableandview.map(full => {
      const [schema, table] = full.includes('.') ? full.split('.') : ['public', full];
      return { schema, table };
    });

    const placeholders = tableSchemas.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
    const params = tableSchemas.flatMap(({ schema, table }) => [schema, table]);

    const tableResult = await pool.query(
      `SELECT table_schema, table_name FROM information_schema.tables WHERE (table_schema, table_name) IN (${placeholders})`,
      params
    );

    const foundTables = new Set(tableResult.rows.map(row => `${row.table_schema}.${row.table_name}`));
    const missingTables = tableandview.filter(t => !foundTables.has(t));
    if (missingTables.length > 0) {
      return res.status(400).json({
        message: `Missing tables: ${missingTables.join(', ')}`,
        error: "Invalid table selection",
      });
    }

    if (tableandview.length > 1) {
      const allTableNames = tableSchemas.map(({ schema, table }) => `"${schema}"."${table}"`);
      const relResult = await pool.query(
        `SELECT conrelid::regclass::text AS source_table, confrelid::regclass::text AS target_table
         FROM pg_constraint
         WHERE contype = 'f'
         AND conrelid::regclass::text = ANY($1)
         AND confrelid::regclass::text = ANY($1)`,
        [allTableNames]
      );
      if (relResult.rows.length === 0) {
        return res.status(400).json({
          message: `The selected tables/views are not related.`,
          error: "No foreign key relationship",
        });
      }
    }

    const colResult = await pool.query(
      `SELECT table_schema, table_name, column_name, data_type
       FROM information_schema.columns
       WHERE (table_schema, table_name) IN (${placeholders})`,
      params
    );

    const columnMap = new Map();
    colResult.rows.forEach(row => {
      columnMap.set(`${row.table_schema}.${row.table_name}.${row.column_name}`, row.data_type);
    });

    const invalidColumns = selectedcolumns.filter(col => !columnMap.has(col));
    if (invalidColumns.length > 0) {
      return res.status(400).json({
        message: `Invalid selected columns: ${invalidColumns.join(', ')}`,
        error: "Invalid columns",
      });
    }

    await validateFilters(filters, columnMap);
    validateGroupAndSort(fieldtype, selectedcolumns, groupby, sortby, columnMap);

    // ✅ Prepare config and attach to request for next handler
    req.reportConfig = {
      tables: tableandview,
      fieldtype,
      selection: selectedcolumns,
      filters: filters.map(f => ({
        field: normalizeField(f.field),
        operator: f.operator,
        value: f.value,
        valueFrom: f.valueFrom,
        valueTo: f.valueTo,
      })),
      groupBy: groupby.map(g => ({
        field: normalizeField(g.field),
      })),
      sortBy: sortby.map(col => ({
        column: normalizeField(col.field),
        order: col.direction,
      })),
      xyaxis: xyaxis.map(axis => ({
        x: {
          field: normalizeField(axis.xAxisField),
          order: axis.xAxisDirection,
          transformation: axis.xAxisTransformation || "raw",
        },
        y: {
          field: normalizeField(axis.yAxisField),
          order: axis.yAxisDirection,
          aggregation: axis.yAxisAggregation || "count",
        },
      })),
    };

    next();
  } catch (err) {
    return res.status(400).json({ message: err.message, error: "Validation error" });
  }
}

module.exports = {
  listTablesAndViews,
  CheckRelationAndListOfColumn,
  PreviewReport,
  ListReport,
  GetReportById,
  SaveReportConfiguration,
};
