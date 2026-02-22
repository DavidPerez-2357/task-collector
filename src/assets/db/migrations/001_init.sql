-- -----------------------------------------------------
-- 1. TABLAS PRINCIPALES (Sin claves foráneas)
-- -----------------------------------------------------

CREATE TABLE item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  image_name TEXT NOT NULL,
  sell_price INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_name TEXT NOT NULL
);

CREATE TABLE collection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  badge_image_name TEXT NOT NULL,
);

CREATE TABLE player_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coins INTEGER NOT NULL DEFAULT 0
);

-- -----------------------------------------------------
-- 2. TABLAS DEPENDIENTES (Con claves foráneas)
-- -----------------------------------------------------

CREATE TABLE collection_item (
  collection_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  PRIMARY KEY (collection_id, item_id),
  FOREIGN KEY (collection_id) REFERENCES collection(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
);

CREATE TABLE task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  effort INTEGER NOT NULL,
  reset_on_cycle INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER,
  deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);

CREATE TABLE task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  days_late INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
);

CREATE TABLE task_active (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
);

CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  coins_earned INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE SET NULL
);

CREATE TABLE player_collection (
  collection_id INTEGER NOT NULL,
  purchased_at TEXT NOT NULL,
  PRIMARY KEY (collection_id),
  FOREIGN KEY (collection_id) REFERENCES collection(id) ON DELETE CASCADE
);

CREATE TABLE inventory (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   item_id INTEGER NOT NULL,
   quantity INTEGER NOT NULL DEFAULT 0,
   is_shiny INTEGER NOT NULL DEFAULT 0,

   CONSTRAINT inventory_unique_item UNIQUE (item_id, is_shiny),

   FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
);
