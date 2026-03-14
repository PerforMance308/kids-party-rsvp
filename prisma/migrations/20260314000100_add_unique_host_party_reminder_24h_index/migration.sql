DELETE FROM "email_notifications" a
USING "email_notifications" b
WHERE a.id < b.id
  AND a.type = 'HOST_PARTY_REMINDER_24H'
  AND b.type = 'HOST_PARTY_REMINDER_24H'
  AND a.user_id = b.user_id
  AND a.related_id = b.related_id;

CREATE UNIQUE INDEX "email_notifications_host_party_reminder_24h_unique"
ON "email_notifications" ("user_id", "related_id", "type")
WHERE "type" = 'HOST_PARTY_REMINDER_24H';
