-- Run these on your MySQL database

-- 1. last_seen for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen DATETIME NULL DEFAULT NULL;

-- 2. File sharing columns on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) NULL DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(100) NULL DEFAULT NULL;

-- 3. Emoji reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  message_id INT NOT NULL,
  user_id    INT NOT NULL,
  emoji      VARCHAR(10) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaction (message_id, user_id, emoji),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);
