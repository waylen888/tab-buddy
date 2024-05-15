-- SQLite
CREATE TABLE IF NOT EXISTS "user_setting" (
	"user_id"	TEXT NOT NULL,
	"theme_mode"	TEXT NOT NULL,
	"push_notification"	BOOLEAN NOT NULL DEFAULT 0,
	PRIMARY KEY("user_id"),
	FOREIGN KEY("user_id") REFERENCES "user"("id") ON DELETE CASCADE
);