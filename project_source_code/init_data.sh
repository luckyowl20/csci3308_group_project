PG_URI="postgresql://lucky_moment_db_9qd6_user:maj5q8kNWO7zq34lzwSkkx7P9prsFk3c@dpg-d048opadbo4c73ec7dng-a.oregon-postgres.render.com/lucky_moment_db_9qd6"
# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done