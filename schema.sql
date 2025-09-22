CREATE TABLE IF NOT EXISTS songs (
  songId VARCHAR(50) PRIMARY KEY,
  filename VARCHAR(255),
  title VARCHAR(255),
  tags JSON
);

CREATE TABLE IF NOT EXISTS users (
  chatId INTEGER PRIMARY KEY,
  userId VARCHAR(255),
  email VARCHAR(255),
  accessToken TEXT,
  refreshToken TEXT,
  expiresAt INTEGER
);