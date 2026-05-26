import os
import requests
import boto3
from dotenv import load_dotenv, find_dotenv

# Load env variables
load_dotenv(find_dotenv())

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
RDS_INSTANCE_IDENTIFIER = "lawdb" # From your DSN: lawdb.cfge8ai08o3t...

def get_current_ip():
    try:
        response = requests.get("https://checkip.amazonaws.com")
        return response.text.strip()
    except Exception as e:
        print(f"Error detecting IP: {e}")
        return None

def update_security_group():
    my_ip = get_current_ip()
    if not my_ip:
        return

    print(f"Current Public IP: {my_ip}")

    ec2 = boto3.client(
        "ec2",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    rds = boto3.client(
        "rds",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )

    try:
        # 1. Find the DB Instance
        response = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCE_IDENTIFIER)
        db_instance = response['DBInstances'][0]
        
        # 2. Get the first Security Group associated with it
        sg_id = db_instance['VpcSecurityGroups'][0]['VpcSecurityGroupId']
        print(f"Target Security Group ID: {sg_id}")

        # 3. Check existing rules to avoid duplicates
        sg = ec2.describe_security_groups(GroupIds=[sg_id])['SecurityGroups'][0]
        
        # 4. Revoke old "Auto-Whitelist" rules if they exist (optional, but good for cleanup)
        # For simplicity, we'll just check if current IP is already there
        exists = False
        for rule in sg.get('IpPermissions', []):
            if rule.get('FromPort') == 5432:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == f"{my_ip}/32":
                        exists = True
                        break
        
        if exists:
            print("✅ Your IP is already whitelisted.")
            return

        # 5. Authorize the new IP
        print(f"Whitelisting {my_ip} for port 5432...")
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 5432,
                    'ToPort': 5432,
                    'IpRanges': [{'CidrIp': f"{my_ip}/32", 'Description': 'Auto-whitelisted by Assistant'}]
                }
            ]
        )
        print("✅ Success! Your IP has been added.")

    except Exception as e:
        print(f"❌ Failed to update security group: {e}")

if __name__ == "__main__":
    update_security_group()
