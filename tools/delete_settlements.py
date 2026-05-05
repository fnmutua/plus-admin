#!/usr/bin/env python3
"""
Script to delete settlements using the same API flow as the frontend.
Reads settlement IDs from a CSV and calls the /api/v1/data/delete endpoint
for the settlement model. No direct DB access.
"""

import csv
import sys
import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path

import requests

# Try to load python-dotenv if available
try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False
    print("Warning: python-dotenv not installed. Install with: pip install python-dotenv")
    print("Continuing without .env file support...")

# Load environment variables from project root `.env` (see repo README / .env.example).
ENV_FILES = ['.env', '.env.local']
script_dir = Path(__file__).parent.resolve()
project_root = script_dir.parent

if DOTENV_AVAILABLE:
    env_loaded = False
    for env_file in ENV_FILES:
        env_path = project_root / env_file
        if env_path.exists():
            load_dotenv(env_path)
            env_loaded = True
            print(f"Loaded environment variables from: {env_path}")
            break
    
    if not env_loaded:
        # Also try loading from current directory
        for env_file in ENV_FILES:
            env_path = Path(env_file)
            if env_path.exists():
                load_dotenv(env_path)
                env_loaded = True
                print(f"Loaded environment variables from: {env_path}")
                break

# Configure logging (ASCII-safe)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(
            f'settlement_deletion_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log',
            encoding='utf-8'
        ),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# API configuration - Read from environment variables with fallback defaults
API_BASE = os.getenv('VITE_APP_HOST', os.getenv('API_HOST', 'http://localhost'))
API_USERNAME = os.getenv('API_USERNAME', os.getenv('VITE_APP_API_USERNAME', ''))
API_PASSWORD = os.getenv('API_PASSWORD', os.getenv('VITE_APP_API_PASSWORD', ''))
API_TIMEOUT = int(os.getenv('API_TIMEOUT', '20'))

LOGIN_ENDPOINT = f"{API_BASE}/api/auth/signin"
DELETE_ENDPOINT = f"{API_BASE}/api/v1/data/delete"

class SettlementDeleter:
    def __init__(self, api_base: str, username: str, password: str, timeout: int = 20):
        self.api_base = api_base.rstrip('/')
        self.username = username
        self.password = password
        self.timeout = timeout
        self.session = requests.Session()
        self.token: Optional[str] = None

    def authenticate(self) -> bool:
        """Authenticate and store token."""
        try:
            payload = {
                "username": self.username,
                "password": self.password
            }
            resp = self.session.post(
                LOGIN_ENDPOINT,
                json=payload,
                timeout=self.timeout,
            )
            if resp.status_code != 200:
                logger.error(f"Login failed (status {resp.status_code}): {resp.text}")
                return False
            data = resp.json()
            token = data.get("data") or data.get("accessToken")
            if not token:
                logger.error("Login response did not include token in 'data' or 'accessToken'")
                return False
            self.token = token
            logger.info("Authenticated successfully")
            return True
        except Exception as e:
            logger.error(f"Login error: {e}")
            return False

    def _auth_headers(self) -> Dict[str, str]:
        return {"x-access-token": self.token} if self.token else {}

    def delete_settlement_api(self, settlement_id: int) -> bool:
        """Delete settlement via API using same payload as frontend DeleteRecord."""
        try:
            payload = {"id": settlement_id, "model": "settlement"}
            resp = self.session.post(
                DELETE_ENDPOINT,
                json=payload,
                headers=self._auth_headers(),
                timeout=self.timeout,
            )
            if resp.status_code != 200:
                logger.error(f"Delete failed for {settlement_id} (status {resp.status_code}): {resp.text}")
                return False
            data = resp.json()
            code = data.get("code") or data.get("status") or ""
            if code == "0000":
                logger.info(f"Deleted settlement {settlement_id}")
                return True
            else:
                logger.error(f"Delete failed for {settlement_id}: {data}")
                return False
        except Exception as e:
            logger.error(f"Delete error for {settlement_id}: {e}")
            return False

    def process_settlement(self, settlement_id: int, dry_run: bool = False) -> bool:
        if settlement_id <= 0:
            logger.warning(f"Skipping invalid settlement id: {settlement_id}")
            return False

        logger.info("\n" + "=" * 60)
        logger.info(f"Processing settlement ID: {settlement_id}")
        logger.info("=" * 60)

        if dry_run:
            logger.info(f"[DRY RUN] Would delete settlement {settlement_id}")
            return True

        return self.delete_settlement_api(settlement_id)
    
    def read_settlement_ids_from_csv(self, csv_file: str) -> List[int]:
        """Read settlement IDs from CSV file"""
        settlement_ids = []
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                # Try common column names
                id_column = None
                for col in ['id', 'settlement_id', 'settlementId', 'ID', 'Settlement ID']:
                    if col in reader.fieldnames:
                        id_column = col
                        break
                
                if not id_column:
                    # Use first column if no match
                    id_column = reader.fieldnames[0]
                    logger.warning(f"No standard ID column found, using first column: {id_column}")
                
                logger.info(f"Reading settlement IDs from column: {id_column}")
                
                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                    try:
                        settlement_id = int(str(row[id_column]).strip())
                        if settlement_id not in settlement_ids:
                            settlement_ids.append(settlement_id)
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Skipping row {row_num}: Invalid ID value - {e}")
                        continue
            
            logger.info(f"Read {len(settlement_ids)} unique settlement IDs from CSV")
            return settlement_ids
            
        except FileNotFoundError:
            logger.error(f"CSV file not found: {csv_file}")
            raise
        except Exception as e:
            logger.error(f"Error reading CSV file: {e}")
            raise
    
    def process_csv(self, csv_file: str, dry_run: bool = False):
        """Process all settlements from CSV file and write results CSV with Deleted?/Reason."""
        settlement_ids = self.read_settlement_ids_from_csv(csv_file)
        
        if dry_run:
            logger.info("\n" + "="*60)
            logger.info("DRY RUN MODE - No deletions will be performed")
            logger.info("="*60)
            logger.info(f"Would process {len(settlement_ids)} settlements:")
            for sid in settlement_ids:
                logger.info(f"  - Settlement ID: {sid}")
            return
        
        logger.info(f"\nStarting deletion of {len(settlement_ids)} settlements...")
        logger.info("="*60)
        
        successful = 0
        failed = 0
        results: List[Dict[str, Any]] = []
        
        for idx, settlement_id in enumerate(settlement_ids, 1):
            logger.info(f"\n[{idx}/{len(settlement_ids)}] Processing settlement {settlement_id}...")
            
            ok = self.process_settlement(settlement_id, dry_run=dry_run)
            if ok:
                successful += 1
                results.append({
                    "id": settlement_id,
                    "deleted": "yes",
                    "reason": ""
                })
            else:
                failed += 1
                results.append({
                    "id": settlement_id,
                    "deleted": "no",
                    "reason": "delete failed"
                })
        
        # Write results CSV
        out_name = f"settlement_deletion_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        try:
            with open(out_name, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["id", "deleted", "reason"])
                writer.writeheader()
                writer.writerows(results)
            logger.info(f"Results written to {out_name}")
        except Exception as e:
            logger.error(f"Failed to write results CSV: {e}")
        
        logger.info("\n" + "="*60)
        logger.info("DELETION SUMMARY")
        logger.info("="*60)
        logger.info(f"Total processed: {len(settlement_ids)}")
        logger.info(f"Successful: {successful}")
        logger.info(f"Failed: {failed}")
        logger.info("="*60)


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Delete settlements from CSV file',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example usage:
  python delete_settlements.py settlements.csv
  python delete_settlements.py settlements.csv --dry-run
        """
    )
    
    parser.add_argument('csv_file', help='Path to CSV file containing settlement IDs')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be deleted without actually deleting')
    
    args = parser.parse_args()
    
    # Validate credentials
    if not API_USERNAME or not API_PASSWORD:
        logger.error("API_USERNAME and API_PASSWORD must be set in .env")
        sys.exit(1)

    logger.info("API Configuration:")
    logger.info(f"  Host: {API_BASE}")
    logger.info(f"  Username: {API_USERNAME}")
    logger.info(f"  Password: {'***SET***' if API_PASSWORD else 'NOT SET'}")
    
    deleter = SettlementDeleter(API_BASE, API_USERNAME, API_PASSWORD, timeout=API_TIMEOUT)
    
    try:
        if not deleter.authenticate():
            sys.exit(1)
        deleter.process_csv(args.csv_file, dry_run=args.dry_run)
    except KeyboardInterrupt:
        logger.warning("\n\nProcess interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        logger.exception("Full error traceback:")
        sys.exit(1)


if __name__ == '__main__':
    main()
