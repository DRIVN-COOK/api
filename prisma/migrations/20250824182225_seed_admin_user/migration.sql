-- Admin: admin@test.local / Admin123!
-- bcrypt hash généré (10 rounds):
-- $2b$10$PwkI//btgKpaKtl1H0Q/g.5u7UtYu/NyvQF5GSznnrWSghG6L1Wne

INSERT INTO "User" ("id","email","passwordHash","role","createdAt","updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@test.local',
  '$2b$10$PwkI//btgKpaKtl1H0Q/g.5u7UtYu/NyvQF5GSznnrWSghG6L1Wne',
  'ADMIN'::"Role",
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO NOTHING;
