
CREATE TABLE IF NOT EXISTS item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT NOT NULL,
  image_name TEXT NOT NULL,
  sell_price INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  badge_image_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coins INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS  collection_item (
  collection_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  is_shiny INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, item_id, is_shiny),
  FOREIGN KEY (collection_id) REFERENCES collection(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  interval INTEGER NOT NULL,
  effort INTEGER NOT NULL,
  reset_on_cycle INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER,
  deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS weekly_recurrence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
  CONSTRAINT unique_task_weekday UNIQUE (task_id, weekday)
);

CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  days_late INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_active (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  coins_earned INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS player_collection (
  collection_id INTEGER NOT NULL,
  purchased_at TEXT NOT NULL,
  PRIMARY KEY (collection_id),
  FOREIGN KEY (collection_id) REFERENCES collection(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   item_id INTEGER NOT NULL,
   quantity INTEGER NOT NULL DEFAULT 0,
   is_shiny INTEGER NOT NULL DEFAULT 0,

   CONSTRAINT inventory_unique_item UNIQUE (item_id, is_shiny),

   FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_collection_item (
  collection_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  slot_is_shiny INTEGER NOT NULL,
  deposited_is_shiny INTEGER NOT NULL,
  PRIMARY KEY (collection_id, item_id, slot_is_shiny),
  FOREIGN KEY (collection_id, item_id, slot_is_shiny) REFERENCES collection_item(collection_id, item_id, is_shiny) ON DELETE CASCADE
);
