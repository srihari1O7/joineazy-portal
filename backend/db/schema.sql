-- backend/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  created_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A student can belong to only one group (user_id is UNIQUE)
CREATE TABLE IF NOT EXISTS group_members (
  group_id  INTEGER NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  due_date      TIMESTAMPTZ NOT NULL,
  onedrive_link TEXT NOT NULL,
  created_by    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional targeting: if an assignment has NO rows here, it is for ALL groups
CREATE TABLE IF NOT EXISTS assignment_groups (
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      INTEGER NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, group_id)
);

-- One confirmation per group per assignment
CREATE TABLE IF NOT EXISTS submissions (
  id            SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_id      INTEGER NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  confirmed_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, group_id)
);