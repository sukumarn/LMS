-- Quiz attempts table to track learner quiz results
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id             uuid REFERENCES lesson_quizzes(id) ON DELETE SET NULL,
  score_percent       integer NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  passed              boolean NOT NULL,
  question_count      integer NOT NULL,
  correct_count       integer NOT NULL,
  time_taken_seconds  integer,
  is_simulated        boolean NOT NULL DEFAULT false,
  attempted_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx      ON quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_attempted_at_idx ON quiz_attempts (attempted_at);

-- Allow all inserts (app uses NextAuth, not Supabase Auth — admin client handles reads)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_insert_attempts" ON quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_read_attempts"   ON quiz_attempts FOR SELECT USING (true);
