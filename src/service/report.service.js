const pool = require("../config/database.js");
const { getOperatorSymbol, extractLabel,} = require("../utils/Operator.utils.js");
const { quoteField, buildFilterClause, buildOrderClause, buildPaginationClause, buildXYAggregation} = require("../utils/queryHelper.js");
const { setQueryCache, getQueryCache } = require("../utils/queryCache.js");
const objectHash = require("object-hash");


 const executePreviewReport = async (req ,res) => {
 
  const config = req.reportConfig; 
  const baseConfig = { ...config };
   delete baseConfig.page;
   delete baseConfig.pageSize;

  // const cacheKey = objectHash(baseConfig);

  // // Pagination Route Shortcut
  // if (isPagination) {
  //   const cached = getQueryCache(cacheKey);
  //   if (!cached) {
  //     throw {
  //       status: 400,
  //       message: "No cached report found. Please generate preview first.",
  //     };
  //   }

  //   const { baseSql, baseParams, totalCount, isGrouped, groupByList } = cached;

  //   const page = config.page ?? 1;
  //   const pageSize = config.pageSize ?? 10;
  //   const { clause: paginationClause, extraParams } = buildPaginationClause(baseParams.length, page, pageSize);
  //   const finalParams = [...baseParams, ...extraParams];

  //   const pagedSql = `${baseSql} ${paginationClause}`;
  //   const result = await pool.query(pagedSql, finalParams);

  //   const totalPages = Math.ceil(totalCount / pageSize);
  //   return {
  //     count: false,
  //     group: isGrouped,
  //     groupBy: groupByList,
  //     raw: !isGrouped,
  //     pagination: {
  //       page,
  //       pageSize,
  //       totalCount,
  //       totalPages,
  //     },
  //     data: result.rows,
  //   };
  // }

  // // --- Full Query Generation for Preview ---

  if (!config?.tables?.length) {
    throw new Error("Report configuration with at least one table is required");
  }

  const tables = config.tables;
  const tablePairs = tables.map((t) => {
    const [schema, table] = t.split(".");
    return { schema, table };
  });

  // --- FK Relationship Query
  const fkQuery = `
    SELECT
      tc.table_schema AS source_schema,
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_schema AS target_schema,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (
        (tc.table_schema, tc.table_name) IN (${tablePairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
        OR
        (ccu.table_schema, ccu.table_name) IN (${tablePairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
      )
  `;

  const relationRes = await pool.query(fkQuery, tablePairs.flatMap(({ schema, table }) => [schema, table]));
  const relations = relationRes.rows;

  // --- Dynamic JOIN
  let fromClause = `FROM ${quoteField(tables[0])}`;
  const joinedTables = new Set([tables[0]]);
  const configTableSet = new Set(tables);

  while (true) {
    let joinedThisRound = false;

    for (const rel of relations) {
      const source = `${rel.source_schema}.${rel.source_table}`;
      const target = `${rel.target_schema}.${rel.target_table}`;
      if (!configTableSet.has(source) || !configTableSet.has(target)) continue;

      const sourceFull = quoteField(source);
      const targetFull = quoteField(target);
      const sourceField = `${sourceFull}."${rel.source_column}"`;
      const targetField = `${targetFull}."${rel.target_column}"`;

      const sourceJoined = joinedTables.has(source);
      const targetJoined = joinedTables.has(target);

      if (sourceJoined && !targetJoined) {
        fromClause += ` LEFT JOIN ${targetFull} ON ${sourceField} = ${targetField}`;
        joinedTables.add(target);
        joinedThisRound = true;
      } else if (!sourceJoined && targetJoined) {
        fromClause += ` LEFT JOIN ${sourceFull} ON ${sourceField} = ${targetField}`;
        joinedTables.add(source);
        joinedThisRound = true;
      }
    }

    if (tables.every((t) => joinedTables.has(t))) break;
    if (!joinedThisRound) throw new Error("Could not join all selected tables due to missing relationships");
  }

  // --- Selection
  let selection = "*";
  if (config.selection?.length > 0) {
    selection = config.selection.map((col) => {
      const alias = col.split(".").pop();
      return `${quoteField(col)} AS "${alias}"`;
    }).join(", ");
  }

  // --- Filter, Sort, Pagination Setup
  const { whereClause, params } = buildFilterClause(config.filters || []);
  const orderByClause = buildOrderClause(config.sortBy || []);
  const groupByList = config.groupBy?.map((g) => g.field.replace(/\./g, " - ")) || [];
  const isGrouped = groupByList.length > 0;

  // --- Count & XY Aggregation Mode
  if (config.fieldtype?.toLowerCase() === "count" && config.xyaxis?.length > 0) {
    const { groupedSQL } = buildXYAggregation(config.xyaxis[0], fromClause, whereClause, orderByClause);
    const result = await pool.query(groupedSQL, params);

    const chart = {
      type: "bar",
      data: {
        labels: result.rows.map((r) => r.xAxis),
        datasets: [
          {
            label: config.xyaxis[0].y.aggregation.toUpperCase(),
            data: result.rows.map((r) => Number(r.yAxis)),
            backgroundColor: "#14b8a6",
          },
        ],
      },
    };

    return {
      
      count: true,
      group: false,
      groupBy: null,
      raw: false,
      chart: [chart],
      data: result.rows,
    };
  }

  // --- Build SQL & Cache it
  const baseSql = `SELECT ${selection} ${fromClause}${whereClause}${orderByClause}`;
  const countSql = `SELECT COUNT(*) AS total ${fromClause}${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  setQueryCache(cacheKey, {
    baseSql,
    baseParams: [...params],
    totalCount,
    isGrouped,
    groupByList,
  });

  // --- Paginated Query Execution

 
  const page = config.page ?? 1;
  const pageSize = config.pageSize ?? 10;
  const { clause: paginationClause, extraParams } = buildPaginationClause(params.length, page, pageSize);
  params.push(...extraParams);

  const pagedSql = `${baseSql} ${paginationClause}`;
  let result = await pool.query(pagedSql, params);
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    queryKey: cacheKey,
    count: false,
    group: isGrouped,
    groupBy: groupByList,
    raw: !isGrouped,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    data: result.rows,
  };
   
};

 const Executionfunction = async (config, isPagination = false) => {
  const baseConfig = { ...config };
  delete baseConfig.page;
  delete baseConfig.pageSize;

  const cacheKey = objectHash(baseConfig);

  // Pagination Route Shortcut
  if (isPagination) {
    const cached = getQueryCache(cacheKey);
    if (!cached) {
      throw {
        status: 400,
        message: "No cached report found. Please generate preview first.",
      };
    }

    const { baseSql, baseParams, totalCount, isGrouped, groupByList } = cached;

    const page = config.page ?? 1;
    const pageSize = config.pageSize ?? 10;
    const { clause: paginationClause, extraParams } = buildPaginationClause(baseParams.length, page, pageSize);
    const finalParams = [...baseParams, ...extraParams];

    const pagedSql = `${baseSql} ${paginationClause}`;
    const result = await pool.query(pagedSql, finalParams);

    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      count: false,
      group: isGrouped,
      groupBy: groupByList,
      raw: !isGrouped,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
      data: result.rows,
    };
  }

  // --- Full Query Generation for Preview ---

  if (!config?.tables?.length) {
    throw new Error("Report configuration with at least one table is required");
  }

  const tables = config.tables;
  const tablePairs = tables.map((t) => {
    const [schema, table] = t.split(".");
    return { schema, table };
  });

  // --- FK Relationship Query
  const fkQuery = `
    SELECT
      tc.table_schema AS source_schema,
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_schema AS target_schema,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (
        (tc.table_schema, tc.table_name) IN (${tablePairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
        OR
        (ccu.table_schema, ccu.table_name) IN (${tablePairs.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ")})
      )
  `;

  const relationRes = await pool.query(fkQuery, tablePairs.flatMap(({ schema, table }) => [schema, table]));
  const relations = relationRes.rows;

  // --- Dynamic JOIN
  let fromClause = `FROM ${quoteField(tables[0])}`;
  const joinedTables = new Set([tables[0]]);
  const configTableSet = new Set(tables);

  while (true) {
    let joinedThisRound = false;

    for (const rel of relations) {
      const source = `${rel.source_schema}.${rel.source_table}`;
      const target = `${rel.target_schema}.${rel.target_table}`;
      if (!configTableSet.has(source) || !configTableSet.has(target)) continue;

      const sourceFull = quoteField(source);
      const targetFull = quoteField(target);
      const sourceField = `${sourceFull}."${rel.source_column}"`;
      const targetField = `${targetFull}."${rel.target_column}"`;

      const sourceJoined = joinedTables.has(source);
      const targetJoined = joinedTables.has(target);

      if (sourceJoined && !targetJoined) {
        fromClause += ` LEFT JOIN ${targetFull} ON ${sourceField} = ${targetField}`;
        joinedTables.add(target);
        joinedThisRound = true;
      } else if (!sourceJoined && targetJoined) {
        fromClause += ` LEFT JOIN ${sourceFull} ON ${sourceField} = ${targetField}`;
        joinedTables.add(source);
        joinedThisRound = true;
      }
    }

    if (tables.every((t) => joinedTables.has(t))) break;
    if (!joinedThisRound) throw new Error("Could not join all selected tables due to missing relationships");
  }

  // --- Selection
  let selection = "*";
  if (config.selection?.length > 0) {
    selection = config.selection.map((col) => {
      const alias = col.split(".").pop();
      return `${quoteField(col)} AS "${alias}"`;
    }).join(", ");
  }

  // --- Filter, Sort, Pagination Setup
  const { whereClause, params } = buildFilterClause(config.filters || []);
  const orderByClause = buildOrderClause(config.sortBy || []);
   // const groupByList = config.groupBy?.map((g) => g.field.replace(/\./g, " - ")) || [];
  const groupByList = config.groupBy?.map((g) => {
  const parts = g.field.split('.');
  return parts[parts.length - 1]; // gets the last segment
}) || [];
  const isGrouped = groupByList.length > 0;

  // --- Count & XY Aggregation Mode
  if (config.fieldtype?.toLowerCase() === "count" && config.xyaxis?.length > 0) {
    const { groupedSQL } = buildXYAggregation(config.xyaxis[0], fromClause, whereClause, orderByClause);
    const result = await pool.query(groupedSQL, params);

    const chart = {
      type: "bar",
      data: {
        labels: result.rows.map((r) => r.xAxis),
        datasets: [
          {
            label: config.xyaxis[0].y.aggregation.toUpperCase(),
            data: result.rows.map((r) => Number(r.yAxis)),
            backgroundColor: "#14b8a6",
          },
        ],
      },
    };

    return {
      
      count: true,
      group: false,
      groupBy: null,
      raw: false,
      chart: [chart],
      data: result.rows,
    };
  }

  // --- Build SQL & Cache it
  const baseSql = `SELECT ${selection} ${fromClause}${whereClause}${orderByClause}`;
  const countSql = `SELECT COUNT(*) AS total ${fromClause}${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  setQueryCache(cacheKey, {
    baseSql,
    baseParams: [...params],
    totalCount,
    isGrouped,
    groupByList,
  });

  // --- Paginated Query Execution
  const page = config.page ?? 1;
  const pageSize = config.pageSize ?? 10;
  const { clause: paginationClause, extraParams } = buildPaginationClause(params.length, page, pageSize);
  params.push(...extraParams);

  const pagedSql = `${baseSql} ${paginationClause}`;
  const result = await pool.query(pagedSql, params);
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    queryKey: cacheKey,
    count: false,
    group: isGrouped,
    groupBy: groupByList,
    raw: !isGrouped,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    data: result.rows,
  };
};
  
const PaginatedReport = async (req, res) => {
  try {
    console.log('req');
    const { queryKey, page = 1, pageSize = 10 } = req.query;

    if (!queryKey) {
      return res.status(400).json({ error: "Missing queryKey in request" });
    }

    const cached = getQueryCache(queryKey);
    if (!cached) {
      return res.status(404).json({ error: "Cached query not found or expired" });
    }

    const { baseSql, baseParams, totalCount } = cached;

    const offset = (page - 1) * pageSize;
    const pagedSql = `${baseSql} LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`;
    const params = [...baseParams, parseInt(pageSize, 10), parseInt(offset, 10)];

    const result = await pool.query(pagedSql, params);

    res.json({
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      data: result.rows,
    });
  } catch (error) {
    console.error("Pagination error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


async function getPaginatedReports(limit, offset) {
  const query = `
    SELECT fieldtype, report_id, report_name, table_name AS tableandView,
           selected_columns AS selectedColumns, filter_criteria AS filters,
           group_by AS groupBy, sort_order AS sortBy, axis_config AS xyaxis
    FROM report_configuration
    ORDER BY report_id
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
}

async function getTotalReportCount() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM report_configuration');
  return parseInt(rows[0].count, 10);
}

async function getReportById(reportId) {
  const query = `SELECT * FROM report_configuration WHERE report_id = $1`;
  const { rows } = await pool.query(query, [reportId]);
  return rows[0] || null;
}
 
async function insertReportConfiguration({
  userId = 0,
  reportname,
  tableandview,
  selectedcolumns,
  filters,
  groupby,
  sortby,
  xyaxis,
  fieldtype
}) {
  const result = await pool.query(
    `
    INSERT INTO report_configuration (
      user_id,
      report_name,
      table_name,
      selected_columns,
      filter_criteria,
      group_by,
      sort_order,
      axis_config,
      fieldtype  
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING report_id;
    `,
    [
      userId,
      reportname,
      tableandview,
      selectedcolumns,
      filters,
      groupby,
      sortby,
      xyaxis,
      fieldtype
    ]
  );
  return result.rows[0].report_id;
}
 
async function updateReportConfiguration(id, {
  userId,
  reportname,
  tableandview,
  selectedcolumns,
  filters,
  groupby,
  sortby,
  xyaxis,
  fieldtype
}) {
  const result = await pool.query(
    `
    UPDATE report_configuration 
    SET user_id = $1,
        report_name = $2,
        table_name = $3,
        selected_columns = $4,
        filter_criteria = $5,
        group_by = $6,
        sort_order = $7,
        axis_config = $8,
        fieldtype = $9
    WHERE report_id = $10
    RETURNING report_id;
    `,
    [
      userId,
      reportname,
      tableandview,
      selectedcolumns,
      filters,
      groupby,
      sortby,
      xyaxis,
      fieldtype,
      id
    ]
  );
  return result.rows[0].report_id;
}

async function getTablesAndViews() {
  const query = `
    SELECT 
      table_schema AS schema,
      table_name AS name,
      table_type AS type
    FROM information_schema.tables
    ORDER BY table_schema, table_type, table_name
  `;

  const result = await pool.query(query);

  return result.rows.map(row => ({
    name: `${row.schema}.${row.name}`, // schema.table_name
    type: row.type === 'BASE TABLE' ? 'table' : 'view',
  }));
}

module.exports = {  Executionfunction
  ,PaginatedReport
  ,getPaginatedReports
  , getTotalReportCount 
  ,getReportById
   , insertReportConfiguration,
  updateReportConfiguration
  ,getTablesAndViews
};
