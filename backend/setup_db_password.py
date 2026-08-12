import os
import re

env_path = os.path.join(os.path.dirname(__file__), "..", ".env")

def main():
    print("========================================")
    print(" PostgreSQL Password Configuration Tool")
    print("========================================")
    print("The backend cannot connect because the .env file still contains placeholder passwords.")
    
    password = input("\nPlease type your local PostgreSQL password for user 'postgres': ").strip()
    
    if not password:
        print("Password cannot be empty.")
        return
        
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace POSTGRES_PASSWORD
        content = re.sub(
            r'POSTGRES_PASSWORD=.*',
            f'POSTGRES_PASSWORD={password}',
            content
        )
        content = re.sub(
            r'PSQL_PASSWD=.*',
            f'PSQL_PASSWD={password}',
            content
        )
        
        # Replace password in DSN and DATABASE_URL
        content = re.sub(
            r'POSTGRES_DSN=postgresql://postgres:[^@]+@',
            f'POSTGRES_DSN=postgresql://postgres:{password}@',
            content
        )
        content = re.sub(
            r'DATABASE_URL=postgresql://postgres:[^@]+@',
            f'DATABASE_URL=postgresql://postgres:{password}@',
            content
        )
        
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print("\n✅ Successfully updated the .env file with your password!")
        print("\nYou can now run:")
        print("  python verify_db_connection.py")
        print("  python seed_ecosystem.py")
    else:
        print(f"Error: Could not find .env file at {env_path}")

if __name__ == "__main__":
    main()
