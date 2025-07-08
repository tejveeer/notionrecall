CREATE TABLE quiz_attempts(
    id SERIAL NOT NULL,
    username text NOT NULL,
    quiz_id text NOT NULL,
    page_name text NOT NULL,
    attempt_date timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quiz_type text NOT NULL,
    questions jsonb NOT NULL,
    user_answers jsonb NOT NULL,
    PRIMARY KEY(id)
);