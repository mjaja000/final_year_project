const pool = require('../config/database');

class DatabaseStatsModel {
  // Get database statistics
  static async getDatabaseStats() {
    try {
      const query = `
        SELECT
          (SELECT COUNT(*) FROM users) as users_count,
          (SELECT COUNT(*) FROM routes) as routes_count,
          (SELECT COUNT(*) FROM vehicles) as vehicles_count,
          (SELECT COUNT(*) FROM vehicle_occupancy) as occupancy_count,
          (SELECT COUNT(*) FROM payments) as payments_count,
          (SELECT COUNT(*) FROM feedback) as feedback_count,
          (SELECT COUNT(*) FROM activity_logs) as logs_count
      `;
      const result = await pool.query(query);
      const stats = result.rows[0];
      
      return {
        tables: {
          users: parseInt(stats.users_count),
          routes: parseInt(stats.routes_count),
          vehicles: parseInt(stats.vehicles_count),
          vehicle_occupancy: parseInt(stats.occupancy_count),
          payments: parseInt(stats.payments_count),
          feedback: parseInt(stats.feedback_count),
          activity_logs: parseInt(stats.logs_count)
        },
        total_records: Object.values(stats).reduce((sum, val) => sum + parseInt(val), 0)
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // Get database size
  static async getDatabaseSize() {
    try {
      const query = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_size_pretty(pg_total_relation_size('users')) as users_size,
          pg_size_pretty(pg_total_relation_size('vehicles')) as vehicles_size,
          pg_size_pretty(pg_total_relation_size('routes')) as routes_size,
          pg_size_pretty(pg_total_relation_size('payments')) as payments_size,
          pg_size_pretty(pg_total_relation_size('feedback')) as feedback_size
      `;
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting database size:', error);
      throw error;
    }
  }

  // Get table information
  static async getTableInfo() {
    try {
      const query = `
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns 
           WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting table info:', error);
      throw error;
    }
  }

  // Get table columns
  static async getTableColumns(tableName) {
    try {
      const query = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      const result = await pool.query(query, [tableName]);
      return result.rows;
    } catch (error) {
      console.error('Error getting table columns:', error);
      throw error;
    }
  }

  // Get connection count
  static async getConnectionCount() {
    try {
      const query = `
        SELECT 
          count(*) as active_connections,
          max(backend_start) as earliest_connection
        FROM pg_stat_activity
        WHERE datname = current_database();
      `;
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting connection count:', error);
      throw error;
    }
  }

  // Get database health
  static async getDatabaseHealth() {
    try {
      const stats = await this.getDatabaseStats();
      const size = await this.getDatabaseSize();
      const connections = await this.getConnectionCount();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: stats,
        size: size,
        connections: connections
      };
    } catch (error) {
      console.error('Error getting database health:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Get database backup info (simulated)
  static async getBackupInfo() {
    try {
      // This is simulated - in production you'd track actual backups
      const query = `
        SELECT 
          NOW()::timestamp as current_time,
          current_setting('data_directory') as data_directory,
          version() as postgres_version
      `;
      const result = await pool.query(query);
      const info = result.rows[0];

      return {
        last_backup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Simulated: 24 hours ago
        next_backup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Simulated: 24 hours from now
        backup_frequency: 'daily',
        data_directory: info.data_directory,
        postgres_version: info.postgres_version
      };
    } catch (error) {
      console.error('Error getting backup info:', error);
      throw error;
    }
  }

  // Record database metric (for monitoring over time)
  static async recordMetric(metric_name, metric_value, metric_type = 'number') {
    try {
      // Create metrics table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS db_metrics (
          id SERIAL PRIMARY KEY,
          metric_name VARCHAR(100),
          metric_value FLOAT,
          metric_type VARCHAR(50),
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await pool.query(createTableQuery);

      const insertQuery = `
        INSERT INTO db_metrics (metric_name, metric_value, metric_type)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const result = await pool.query(insertQuery, [metric_name, metric_value, metric_type]);
      return result.rows[0];
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }
}

module.exports = DatabaseStatsModel;
