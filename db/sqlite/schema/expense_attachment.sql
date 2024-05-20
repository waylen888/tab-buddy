CREATE TABLE IF NOT EXISTS "expense_attachment" (
	"id"	TEXT NOT NULL,
	"filename"	TEXT NOT NULL,
	"size"	INTEGER NOT NULL,
	"mime"	TEXT NOT NULL,
	"create_at"	DATETIME NOT NULL,
	"update_at"	DATETIME NOT NULL,
	"expense_id"	TEXT NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("expense_id") REFERENCES "expense"("id") ON DELETE CASCADE
);