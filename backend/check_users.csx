#!/usr/bin/env dotnet-script
#r "nuget: Npgsql, 10.0.0"

var connStr = "Host=ep-fancy-wildflower-ah6yvprg-pooler.c-3.us-east-1.aws.neon.tech;Database=bdaey_db;Username=neondb_owner;Password=npg_25CSveuygbos;Ssl Mode=Require;Trust Server Certificate=true;Pooling=true;";

using (var conn = new Npgsql.NpgsqlConnection(connStr))
{
    conn.Open();
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SELECT COUNT(*) FROM quran.\"Users\"";
        var count = cmd.ExecuteScalar();
        Console.WriteLine($"Users count: {count}");
    }
}
