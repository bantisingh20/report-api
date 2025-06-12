/*
SELECT generate_dynamic_sql_data(
  '{
    "tables": ["categories","products"],
    "selection": ["categories.name", "products.name", "products.stock", "products.price", "products.description"],
	 "filters": [
    { "field": "products.stock", "operator": ">", "value": "5" },
    { "field": "products.stock", "operator": "<", "value": "500" }
  ],
  "sortBy": [
    { "column": "products.stock", "order": "DESC" } 
  ],
  "groupBy": [{"field": "categories.name"}, {"field": "products.stock"}],
  "xyaxis":[],
  "xyaxisw": [
    {
      "x": {
        "field": "categories.name",
        "order": "ASC"
         
      },
      "y": {
        "field": "products.stock",
        "aggregation": "avg"
      }
    }
  ]
  }'::jsonb
);

*/ 

CREATE OR REPLACE FUNCTION generate_dynamic_sql_data(config jsonb)
RETURNS jsonb AS $$
DECLARE
    tables TEXT[] := ARRAY(SELECT jsonb_array_elements_text(config->'tables'));
    selection TEXT[] := ARRAY(SELECT jsonb_array_elements_text(config->'selection'));
    base_table TEXT := tables[1];
    other_table TEXT;
    join_sql TEXT := '';
    where_sql TEXT := '';
    order_sql TEXT := '';
    group_sql TEXT := '';
    select_sql TEXT := '';
    final_sql TEXT := '';

    -- XY axis
    xy jsonb;
    x_field TEXT;
    x_order TEXT;
    x_expr TEXT;
    y_field TEXT;
    y_agg TEXT;
    y_expr TEXT;

    -- Loops
    filter jsonb;
    sort jsonb;
    filter_clauses TEXT[] := '{}';
    order_clauses TEXT[] := '{}';

	row RECORD;
    result jsonb := '[]'::jsonb;
BEGIN
    -- Build aliased SELECT
     select_sql := 'SELECT ' || alias_columns(selection) || ' FROM ' || base_table;

    -- JOIN tables using FK
    FOR i IN 2 .. array_length(tables, 1) LOOP
        other_table := tables[i];
        SELECT INTO join_sql join_sql || format(
            ' JOIN %I ON %I.%I = %I.%I',
            other_table,
            fk.foreign_table, fk.foreign_column,
            fk.primary_table, fk.primary_column
        )
        FROM (
            SELECT
                tc.table_name AS foreign_table,
                kcu.column_name AS foreign_column,
                ccu.table_name AS primary_table,
                ccu.column_name AS primary_column
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
            WHERE
                tc.constraint_type = 'FOREIGN KEY'
                AND (
                    (tc.table_name = base_table AND ccu.table_name = other_table)
                    OR
                    (tc.table_name = other_table AND ccu.table_name = base_table)
                )
            LIMIT 1
        ) AS fk;
    END LOOP;

    -- WHERE filters
    FOR filter IN SELECT * FROM jsonb_array_elements(config->'filters') LOOP
        filter_clauses := array_append(
            filter_clauses,
            format('%s %s %L',
                filter->>'field',
                filter->>'operator',
                filter->>'value'
            )
        );
    END LOOP;
    IF array_length(filter_clauses, 1) > 0 THEN
        where_sql := ' WHERE ' || array_to_string(filter_clauses, ' AND ');
    END IF;

    -- ORDER BY
    FOR sort IN SELECT * FROM jsonb_array_elements(config->'sortBy') LOOP
        order_clauses := array_append(
            order_clauses,
            format('%s %s',
                sort->>'column',
                sort->>'order'
            )
        );
    END LOOP;
    IF array_length(order_clauses, 1) > 0 THEN
        order_sql := ' ORDER BY ' || array_to_string(order_clauses, ', ');
    END IF;

    -- XYAXIS logic only if present
    IF jsonb_array_length(config->'xyaxis') > 0 THEN
        xy := config->'xyaxis'->0;

        -- X-axis field and transformation
        x_field := xy->'x'->>'field';
        x_order := COALESCE(xy->'x'->>'order', 'ASC');
        IF COALESCE(xy->'x'->>'transformation', 'raw') = 'date_trunc' THEN
            x_expr := format('date_trunc(''day'', %s)', x_field);
        ELSE
            x_expr := x_field;
        END IF;

        -- Y-axis aggregation
        y_field := xy->'y'->>'field';
        y_agg := COALESCE(xy->'y'->>'aggregation', 'count');
        y_expr := format('%s(%s)', upper(y_agg), y_field);

        -- Override SELECT/GROUPBY
        select_sql := format('SELECT %s AS x, %s AS y FROM %I', x_expr, y_expr, base_table);
        group_sql := ' GROUP BY ' || x_expr;
        order_sql := format(' ORDER BY x %s', x_order);

        final_sql := select_sql || join_sql || where_sql || group_sql || order_sql;

    ELSE
        -- Normal SELECT with joins, where, and sort
        final_sql := select_sql || join_sql || where_sql || order_sql;
    END IF;

 -- Execute the final SQL and collect rows as JSON
    FOR row IN EXECUTE final_sql LOOP
        result := result || to_jsonb(row);
    END LOOP;

    RETURN result;
	
    --RETURN final_sql;
END;
$$ LANGUAGE plpgsql;