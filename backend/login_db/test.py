import psycopg2

conn = psycopg2.connect(
    host="user-login-1.cpqe0w8omttt.eu-north-1.rds.amazonaws.com",
    dbname="postgres",
    user="postgres",
    password="ItnCEoJrFOVDAvHDwt1u",
    port=5432
)
print("Connected!")

cur = conn.cursor()


# create_user_table_query = """
# CREATE TABLE IF NOT EXISTS users (
#     id UUID PRIMARY KEY,
#     email TEXT UNIQUE NOT NULL,
#     password_hash TEXT,
#     google_id TEXT UNIQUE,
#     created_at TIMESTAMP DEFAULT NOW()
# );
# """

# create_session_table_query = """
# CREATE TABLE IF NOT EXISTS sessions (
#     session_id TEXT PRIMARY KEY,
#     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
#     created_at TIMESTAMP DEFAULT NOW()
# );
# """

# cur.execute(create_session_table_query)
# conn.commit()

# cur.close()
# conn.close()

print("Fetching registered users...")
cur.execute("SELECT * FROM users")
users = cur.fetchall()
print(f"Users found: {len(users)}")
for user in users:
    print(user[1])
    print(user[0])
    # print(type(user))

print("\nFetching active sessions...")
cur.execute("SELECT * FROM sessions")
sessions = cur.fetchall()
print(f"Sessions found: {len(sessions)}")
# for session in sessions:
#     print(session)