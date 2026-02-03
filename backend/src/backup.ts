import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const execAsync = promisify(exec);

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  maxBackups: number;
}

class DatabaseBackup {
  private config: BackupConfig;

  constructor() {
    this.config = {
      databaseUrl: process.env.DATABASE_URL || '',
      backupDir: path.join(__dirname, '..', 'backups'),
      maxBackups: 8 // Keep 8 weeks of backups
    };
  }

  async createBackup(): Promise<string> {
    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5); // Remove milliseconds
      
      const backupFileName = `birding_app_backup_${timestamp}.sql`;
      const backupPath = path.join(this.config.backupDir, backupFileName);

      console.log(`Creating database backup: ${backupFileName}`);

      // Create database dump
      await execAsync(`pg_dump "${this.config.databaseUrl}" > "${backupPath}"`);

      // Compress the backup
      await execAsync(`gzip "${backupPath}"`);
      const compressedPath = `${backupPath}.gz`;

      // Get file size
      const stats = fs.statSync(compressedPath);
      const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB

      console.log(`Backup created successfully: ${compressedPath}`);
      console.log(`File size: ${fileSize} MB`);

      return compressedPath;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  async cleanOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupDir)
        .filter(file => file.startsWith('birding_app_backup_') && file.endsWith('.sql.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupDir, file),
          mtime: fs.statSync(path.join(this.config.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Sort by date, newest first

      // Remove old backups if we have more than maxBackups
      if (files.length > this.config.maxBackups) {
        const filesToDelete = files.slice(this.config.maxBackups);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          console.log(`Deleted old backup: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error);
    }
  }

  async uploadToGitHub(backupPath: string): Promise<void> {
    try {
      // This assumes you have git configured and the repo is already set up
      await execAsync('git add backups/');
      await execAsync(`git commit -m "chore: automated database backup $(date +%Y-%m-%d)"`);
      await execAsync('git push');
      console.log('Backup uploaded to GitHub successfully');
    } catch (error) {
      console.error('Failed to upload to GitHub:', error);
      // Don't throw - backup is still created locally
    }
  }

  async performBackup(): Promise<void> {
    try {
      console.log('Starting database backup...');
      
      const backupPath = await this.createBackup();
      await this.cleanOldBackups();
      
      // Optional: Upload to GitHub (requires git setup)
      if (process.env.ENABLE_GIT_UPLOAD === 'true') {
        await this.uploadToGitHub(backupPath);
      }
      
      console.log('Database backup completed successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      process.exit(1);
    }
  }
}

// Script execution
if (require.main === module) {
  const backup = new DatabaseBackup();
  backup.performBackup();
}

export default DatabaseBackup;