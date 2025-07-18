const pool = require("../config/db.js");
const {
  getOperatorSymbol,
  extractLabel,
} = require("../utils/Operator.utils.js");

// const Executionfunction = async (config) => {
//   try {
//     if (!config || !config.tables || config.tables.length === 0) {
//       throw new Error(
//         "Report configuration with at least one table is required"
//       );
//     }

//     console.log(config);
//     const tables = config.tables;

//     // --- Get FK/PK relationships for JOINs ---
//     const joinQuery = `
//       SELECT
//         tc.table_name AS source_table,
//         kcu.column_name AS source_column,
//         ccu.table_name AS target_table,
//         ccu.column_name AS target_column
//       FROM information_schema.table_constraints AS tc
//       JOIN information_schema.key_column_usage AS kcu
//         ON tc.constraint_name = kcu.constraint_name
//         AND tc.table_schema = 'public'
//       JOIN information_schema.constraint_column_usage AS ccu
//         ON ccu.constraint_name = tc.constraint_name
//         AND ccu.table_schema = 'public'
//       WHERE tc.constraint_type = 'FOREIGN KEY'
//         AND (tc.table_name = ANY($1) OR ccu.table_name = ANY($1))
//     `;

//     const relationRes = await pool.query(joinQuery, [tables]);
//     const relations = relationRes.rows;

//     // --- Build JOIN logic ---
//     let fromClause = `FROM ${tables[0]}`;
//     const joinedTables = new Set([tables[0]]);
//     //console.log('Initial Joined Tables:', joinedTables);

//     let allTablesJoined = false;

//     while (!allTablesJoined) {
//       let orderedRelations = [...relations].sort((a, b) => {
//         // Sort by source_table or target_table based on what's already joined
//         if (
//           joinedTables.has(a.source_table) ||
//           joinedTables.has(a.target_table)
//         )
//           return -1;
//         return 1;
//       });

//       //console.log('Ordered Relations:', orderedRelations);

//       let tablesJoinedThisRound = false;

//       // Loop over the relations and build the joins
//       for (const rel of orderedRelations) {
//         const { source_table, source_column, target_table, target_column } =
//           rel;

//         // ✅ Only proceed if both source_table and target_table are in selected tables
//         if (
//           config.tables.includes(source_table) &&
//           config.tables.includes(target_table)
//         ) {
//           const sourceJoined = joinedTables.has(source_table);
//           const targetJoined = joinedTables.has(target_table);

//           if (sourceJoined && !targetJoined) {
//             fromClause += ` LEFT JOIN ${target_table} ON ${source_table}.${source_column} = ${target_table}.${target_column}`;
//             joinedTables.add(target_table);
//             tablesJoinedThisRound = true;
//           } else if (!sourceJoined && targetJoined) {
//             fromClause += ` RIGHT JOIN ${source_table} ON ${source_table}.${source_column} = ${target_table}.${target_column}`;
//             joinedTables.add(source_table);
//             tablesJoinedThisRound = true;
//           }
//           // ✅ Avoid adding duplicate joins if both tables are already joined
//         }
//       }

//       // Check if all tables are joined
//       allTablesJoined = config.tables.every((table) => joinedTables.has(table));

//       if (!allTablesJoined) {
//         console.log("Not all tables joined yet. Continuing...");
//       }
//     }
//     //console.log('Final Joined Tables:', joinedTables);
//     //console.log('Final FROM Clause:', fromClause);

//     // --- Colum Selection ---
//     let selection = "*";

//     if (config.selection?.length > 0) {
//       selection = config.selection
//         .map((col) => {
//           const [table, column] = col.split(".");
//           return `${table}.${column} AS "${table} - ${column}"`;
//         })
//         .join(", ");
//     }

//     const params = [];
//     let paramIndex = 1;
//     let whereClause = "";

//     if (config.filters?.length > 0) {

//       const filterClauses = config.filters
//         .map((filter) => {
//           // console.log('Processing filter:', filter);
//           const sqlOperator = filter.operator;// getOperatorSymbol(filter.operator.toLowerCase());
//           if (!sqlOperator)
//             throw new Error(`Unsupported operator: ${filter.operator}`);
//           //const sqlOperator = operatorMap[filter.operator.toLowerCase()];

//           // console.log(sqlOperator)
//           if (sqlOperator === "between" || sqlOperator.toLowerCase() === "Between") {
//             params.push(filter.valueFrom, filter.valueTo);
//             return `${filter.field
//               } BETWEEN $${paramIndex++} AND $${paramIndex++}`;
//           } else if (sqlOperator === "ILIKE" || filter.operator === "contain") {
//             params.push(`%${filter.value}%`);
//             return `${filter.field} ILIKE $${paramIndex++}`;
//           } else {
//             params.push(filter.value);
//             return `${filter.field} ${sqlOperator} $${paramIndex++}`;
//           }
//         })
//         .join(" AND ");

//       whereClause = ` WHERE ${filterClauses}`;

//       //console.log(filterClauses);
//     }

//     // // --- ORDER BY clause ---
//     let orderByClause = "";
//     if (config.sortBy?.length > 0) {
//       const sortFields = config.sortBy.map((s) => `${s.column} ${s.order}`);
//       orderByClause = ` ORDER BY ${sortFields.join(", ")}`;
//     }

//     console.log(orderByClause);
//     // // --- ORDER BY clause ---
//     // let orderByClause = "";

//     // // Ensure groupBy columns are included in sortBy
//     // if (config.groupBy?.length > 0) {
//     //   config.groupBy.forEach(groupObj => {
//     //     const groupField = groupObj.field;
//     //     const isInSort = config.sortBy?.some(s => s.column === groupField);
//     //     if (!isInSort) {
//     //       config.sortBy = config.sortBy || [];
//     //       config.sortBy.push({ column: groupField, order: "ASC" }); // Default order
//     //     }
//     //   });
//     // }

//     // if (config.sortBy?.length > 0) {
//     //   const sortFields = config.sortBy.map(s => `${s.column} ${s.order}`);
//     //   orderByClause = ` ORDER BY ${sortFields.join(", ")}`;
//     // }

//     // --- Count clause ---
//     if (config.fieldtype.toLowerCase() === "count" && config.xyaxis?.length > 0) {
//       const xyaxis = config.xyaxis[0]; // Assuming only one xyaxis object is passed for simplicity

//       const xAxisField = xyaxis.x.field;
//       const yAxisField = xyaxis.y.field;
//       const xAxisDirection = xyaxis.x.order;
//       const yAxisDirection = xyaxis.y.order;
//       const xAxisTransformation = xyaxis.x.transformation;
//       const yAxisAggregation = xyaxis.y.aggregation;

//       // Handle xAxis transformations (daywise, monthwise, yearwise)
//       let xAxisGroupBy = "";
//       if (xAxisTransformation === "daywise") {
//         xAxisGroupBy = `DATE_TRUNC('day', ${xAxisField})`;
//       } else if (xAxisTransformation === "monthwise") {
//         xAxisGroupBy = `TO_CHAR(${xAxisField}, 'YYYY-MM')`; // Format as YYYY-MM
//       } else if (xAxisTransformation === "yearwise") {
//         xAxisGroupBy = `TO_CHAR(${xAxisField}, 'YYYY')`; // Format as YYYY
//       } else {
//         xAxisGroupBy = `${xAxisField}`; // Default to no transformation
//       }

//       // Handle yAxis aggregation
//       let aggregation = "";
//       if (yAxisAggregation === "count") {
//         aggregation = `COUNT(${yAxisField})`;
//       } else if (yAxisAggregation === "sum") {
//         aggregation = `SUM(${yAxisField})`;
//       } else if (yAxisAggregation === "average") {
//         aggregation = `AVG(${yAxisField})`;
//       } else if (yAxisAggregation === "max") {
//         aggregation = `MAX(${yAxisField})`;
//       } else if (yAxisAggregation === "min") {
//         aggregation = `MIN(${yAxisField})`;
//       }

//       const selectFields = `
//         ${xAxisGroupBy} AS "xAxis",
//         ${aggregation} AS "yAxis"
//       `;

//       // Construct the final SQL query
//       const groupedSQL = `
//         SELECT ${selectFields}
//         ${fromClause}
//         ${whereClause}
//         GROUP BY ${xAxisGroupBy}
//         ${orderByClause}
//       `;

//       console.log("Executing XY Axis SQL:", groupedSQL);

//       const result = await pool.query(groupedSQL, params);

//       const xAxisLabel = extractLabel(xAxisField);
//       const yAxisLabel = extractLabel(yAxisField);

//       // Extract Chart.js formatted data
//       const labels = result.rows.map(row => row.xAxis);
//       const dataPoints = result.rows.map(row => Number(row.yAxis));

//       // Determine transformation label for the title
//       let xAxisTransformLabel = '';
//       if (xAxisTransformation === 'daywise') xAxisTransformLabel = 'DAY';
//       else if (xAxisTransformation === 'monthwise') xAxisTransformLabel = 'MONTH';
//       else if (xAxisTransformation === 'yearwise') xAxisTransformLabel = 'YEAR';
//       else xAxisTransformLabel = xAxisLabel;

//       const chartTitle = `${yAxisAggregation.toUpperCase()} of ${yAxisLabel} by ${xAxisTransformLabel}`;

//       // Chart.js formatted output
//       const chartJSFormattedData = {
//         type: 'bar',
//         data: {
//           labels: labels,
//           datasets: [
//             {
//               label: `${yAxisAggregation.toUpperCase()} of ${yAxisLabel}`,
//               data: dataPoints,
//               backgroundColor: '#14b8a6'
//             }
//           ]
//         }
//       };

//       return {
//         count: true,
//         group: false,
//         groupBy: null,
//         raw: false,
//         chart: [chartJSFormattedData],
//         data: result.rows
//       };
//     }

//     // --- Final SQL ---
//     const sql = `SELECT ${selection} ${fromClause}${whereClause}${orderByClause}`;

//     console.log("Executing SQL:", sql);
//     const result = await pool.query(sql, params);

//     const isGrouped = config.groupBy && config.groupBy.length > 0;

//     return {
//       count: false,
//       group: isGrouped,
//       groupBy: isGrouped ? config.groupBy.map(g => g.field.replace(/\./g, ' - ')) : [],
//       raw: !isGrouped,
//       data: result.rows,
//     };
//     //return { count: false, groupBy:false, raw :true ,data: result.rows  };
//     //return result.rows;
//   } catch (err) {
//     throw {
//       status: 500,
//       message: "Query execution failed",
//       error: err.message,
//     };
//   }
// };


const Executionfunction = async (config) => {
  try {
    if (!config || !config.tables || config.tables.length === 0) {
      throw new Error(
        "Report configuration with at least one table is required"
      );
    }
  

     const tables = config.tables;

    // Step 1: Prepare table schema/table pairs
    const tablePairs = tables.map((t) => {
      const [schema, table] = t.split(".");
      return { schema, table };
    });

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
          (tc.table_schema, tc.table_name) IN (${tablePairs
            .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
            .join(", ")})
          OR
          (ccu.table_schema, ccu.table_name) IN (${tablePairs
            .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
            .join(", ")})
        )
    `;

    const paramValues = tablePairs.flatMap(({ schema, table }) => [schema, table]);

    const relationRes = await pool.query(fkQuery, paramValues);
    const relations = relationRes.rows;

    // Step 2: Construct JOINs
    let fromClause = `FROM ${quoteField(tables[0])}`;
    const joinedTables = new Set([tables[0]]);
    const configTableSet = new Set(tables.map(t => t));

    console.log(configTableSet);
    let allTablesJoined = false;
    while (!allTablesJoined) {
      let tablesJoinedThisRound = false;

      for (const rel of relations) {
        const source = `${rel.source_schema}.${rel.source_table}`;
        const target = `${rel.target_schema}.${rel.target_table}`;

        if (!configTableSet.has(source) || !configTableSet.has(target)) continue;

        const sourceFull = quoteField(`${rel.source_schema}.${rel.source_table}`);
        const targetFull = quoteField(`${rel.target_schema}.${rel.target_table}`);
        const sourceField = `${sourceFull}."${rel.source_column}"`;
        const targetField = `${targetFull}."${rel.target_column}"`;

        const sourceJoined = joinedTables.has(source);
        const targetJoined = joinedTables.has(target);

        if (sourceJoined && !targetJoined) {
          fromClause += ` LEFT JOIN ${targetFull} ON ${sourceField} = ${targetField}`;
          joinedTables.add(target);
          tablesJoinedThisRound = true;
        } else if (!sourceJoined && targetJoined) {
          fromClause += ` LEFT JOIN ${sourceFull} ON ${sourceField} = ${targetField}`;
          joinedTables.add(source);
          tablesJoinedThisRound = true;
        }
      }

      allTablesJoined = tables.every(t => joinedTables.has(t));
      if (!tablesJoinedThisRound && !allTablesJoined) {
        throw new Error("Could not join all selected tables due to missing relationships");
      }
    }

    // Now you have the complete `fromClause` for your SQL query
    //console.log(fromClause);

    let selection = "*";

    if (config.selection?.length > 0) {
      selection = config.selection
        .map((col) => {
          const parts = col.split("."); // ["ecommerce", "categories", "category_id"]
          const columnName = parts[parts.length - 1]; // "category_id"
          return `"${parts[0]}"."${parts[1]}"."${parts[2]}" AS "${columnName}"`;
        })
        .join(", ");
    }

    console.log(selection);

    // Step 4: Filter logic
    const params = [];
    let paramIndex = 1;
    let whereClause = "";

    if (config.filters?.length > 0) {
      const filterClauses = config.filters.map((filter) => {
        const sqlOperator = filter.operator;

        if (sqlOperator === "between") {
          params.push(filter.valueFrom, filter.valueTo);
          return `${
           quoteField(filter.field)
          } BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        } else if (sqlOperator === "ILIKE" || filter.operator === "contain") {
          params.push(`%${filter.value}%`);
          return `${quoteField(filter.field)} ILIKE $${paramIndex++}`;
        } else {
          params.push(filter.value);
          return `${quoteField(filter.field)} ${sqlOperator} $${paramIndex++}`;
        }
      });

      whereClause = ` WHERE ${filterClauses.join(" AND ")}`;
    }

    // Step 5: ORDER BY clause
    let orderByClause = "";
    if (config.sortBy?.length > 0) {
      const sortFields = config.sortBy.map((s) => `${quoteField(s.column)} ${s.order}`);
     // console.log(sortFields)
      orderByClause = ` ORDER BY ${sortFields.join(", ")}`;
    }

    // Step 6: Count mode (XY Axis Reporting)
    if ( config.fieldtype.toLowerCase() === "count" && config.xyaxis?.length > 0 ) 
    {
      console.log('count')
      const xyaxis = config.xyaxis[0];

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
          aggregation = `SUM(${qu(yAxisField)})`;
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
    //  console.log(yAxisField)

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

      const result = await pool.query(groupedSQL, params);


      const labels = result.rows.map((r) => r.xAxis);
      const dataPoints = result.rows.map((r) => Number(r.yAxis));

      const chart = {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: `${yAxisAggregation.toUpperCase()} of ${extractLabel(
                yAxisField
              )}`,
              data: dataPoints,
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
 
 console.log('1')
    // Step 7: Group By + Summary
    const isGrouped = config.groupBy?.length > 0;
    const sql = `SELECT ${selection} ${fromClause}${whereClause}${orderByClause}`;

    console.log(sql);
    const result = await pool.query(sql, params);

    return {
      count: false,
      group: isGrouped,
      groupBy: isGrouped
        ? config.groupBy.map((g) => g.field.replace(/\./g, " - "))
        : [],
      raw: !isGrouped,
      data: result.rows,
    };
  } catch (err) {
    throw {
      status: 500,
      message: "Query execution failed",
      error: err.message,
    };
  }
};
 


function normalizeField(field) {
  return typeof field === "object" && field.column_name
    ? field.column_name
    : field;
}

function quoteField(field) {
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

module.exports = {
  Executionfunction,
};
