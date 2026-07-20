using BdaeyEducat.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BdaeyEducat.API.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260719000100_HardenWalletConcurrency")]
public partial class HardenWalletConcurrency : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Consolidate legacy duplicate wallets before enforcing one wallet per user.
        // Transactions are moved to the oldest wallet and all balances are summed.
        migrationBuilder.Sql(
            """
            WITH ranked AS (
                SELECT "Id", "UserId",
                       MIN("Id") OVER (PARTITION BY "UserId") AS keep_id,
                       ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "Id") AS rn
                FROM quran."Wallets"
            ), totals AS (
                SELECT r.keep_id,
                       SUM(w."Balance") AS balance,
                       SUM(w."OnHoldBalance") AS on_hold,
                       SUM(w."PendingBalance") AS pending
                FROM ranked r
                JOIN quran."Wallets" w ON w."Id" = r."Id"
                GROUP BY r.keep_id
            )
            UPDATE quran."Wallets" keeper
            SET "Balance" = totals.balance,
                "OnHoldBalance" = totals.on_hold,
                "PendingBalance" = totals.pending,
                "UpdatedAt" = NOW()
            FROM totals
            WHERE keeper."Id" = totals.keep_id;

            WITH ranked AS (
                SELECT "Id", "UserId",
                       MIN("Id") OVER (PARTITION BY "UserId") AS keep_id,
                       ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "Id") AS rn
                FROM quran."Wallets"
            )
            UPDATE quran."WalletTransactions" tx
            SET "WalletId" = ranked.keep_id
            FROM ranked
            WHERE tx."WalletId" = ranked."Id" AND ranked.rn > 1;

            WITH ranked AS (
                SELECT "Id",
                       ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "Id") AS rn
                FROM quran."Wallets"
            )
            DELETE FROM quran."Wallets" wallet
            USING ranked
            WHERE wallet."Id" = ranked."Id" AND ranked.rn > 1;
            """);

        migrationBuilder.CreateIndex(
            name: "IX_Wallets_UserId",
            schema: "quran",
            table: "Wallets",
            column: "UserId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_WalletTransactions_ReferenceId",
            schema: "quran",
            table: "WalletTransactions",
            column: "ReferenceId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Wallets_UserId",
            schema: "quran",
            table: "Wallets");

        migrationBuilder.DropIndex(
            name: "IX_WalletTransactions_ReferenceId",
            schema: "quran",
            table: "WalletTransactions");
    }
}
