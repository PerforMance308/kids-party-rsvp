DELETE FROM "email_notifications" a
USING "email_notifications" b
WHERE a.id < b.id
  AND a.type = 'PARTY_REMINDER_24H'
  AND b.type = 'PARTY_REMINDER_24H'
  AND a.user_id = b.user_id
  AND a.related_id = b.related_id;

CREATE UNIQUE INDEX "email_notifications_party_reminder_24h_unique"
ON "email_notifications" ("user_id", "related_id", "type")
WHERE "type" = 'PARTY_REMINDER_24H';
