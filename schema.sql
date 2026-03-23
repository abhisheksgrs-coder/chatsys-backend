-- ============================================================
-- ChatSys Database Schema
-- Run this file once against your Hostinger MySQL database
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  mobile        VARCHAR(20)     NOT NULL,
  pin_hash      VARCHAR(255)    NOT NULL,
  username      VARCHAR(50)     NOT NULL,
  avatar_url    VARCHAR(500)    DEFAULT NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mobile (mobile),
  INDEX idx_mobile (mobile)
);

-- ============================================================
-- FRIEND REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  sender_id     INT UNSIGNED    NOT NULL,
  receiver_id   INT UNSIGNED    NOT NULL,
  status        ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_request (sender_id, receiver_id),
  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_receiver (receiver_id),
  INDEX idx_sender   (sender_id)
);

-- ============================================================
-- FRIENDS
-- ============================================================
CREATE TABLE IF NOT EXISTS friends (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  friend_id     INT UNSIGNED    NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_friendship (user_id, friend_id),
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  sender_id     INT UNSIGNED    NOT NULL,
  receiver_id   INT UNSIGNED    NOT NULL,
  message_text  TEXT            DEFAULT NULL,
  message_type  ENUM('text','music_card') NOT NULL DEFAULT 'text',
  video_id      VARCHAR(50)     DEFAULT NULL,
  is_seen       TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversation (sender_id, receiver_id, created_at),
  INDEX idx_receiver_unseen (receiver_id, is_seen)
);

-- ============================================================
-- SYNC PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_permissions (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED    NOT NULL,
  friend_id     INT UNSIGNED    NOT NULL,
  is_allowed    TINYINT(1)      NOT NULL DEFAULT 1,
  granted_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permission (user_id, friend_id),
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SYNC EVENTS (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_events (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  initiator_id  INT UNSIGNED    NOT NULL,
  receiver_id   INT UNSIGNED    NOT NULL,
  video_id      VARCHAR(50)     NOT NULL,
  event_type    ENUM('play','pause','seek','stop') NOT NULL,
  timestamp_sec DECIMAL(10,3)   NOT NULL DEFAULT 0.000,
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id)  REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session (initiator_id, receiver_id, created_at)
);

SET FOREIGN_KEY_CHECKS = 1;
