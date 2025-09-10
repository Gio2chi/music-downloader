CREATE TABLE IF NOT EXISTS songs (
  songId VARCHAR(50) PRIMARY KEY,
  filename VARCHAR(255),
  title VARCHAR(255),
  tags JSON
);

CREATE TABLE IF NOT EXISTS tokens (
  chatId INTEGER PRIMARY KEY,
  email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  topicId INTEGER
);