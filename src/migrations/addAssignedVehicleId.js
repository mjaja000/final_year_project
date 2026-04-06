const pool = require('../config/database');

/**
 * Migration: Add assigned_vehicle_id column to users table
 * This allows drivers to be assigned to specific vehicles
 */
async function addAssignedVehicleIdColumn() {
  const query = `
    DO $$
    BEGIN
      -- Add assigned_vehicle_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='assigned_vehicle_id'
      ) THEN
        ALTER TABLE users ADD COLUMN assigned_vehicle_id INTEGER;
        
        -- Add foreign key constraint to vehicles table
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_assigned_vehicle 
        FOREIGN KEY (assigned_vehicle_id) 
        REFERENCES vehicles(id) 
        ON DELETE SET NULL;
        
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_users_assigned_vehicle_id 
        ON users(assigned_vehicle_id);
        
        RAISE NOTICE 'Added assigned_vehicle_id column to users table';
      ELSE
        RAISE NOTICE 'assigned_vehicle_id column already exists';
      END IF;
    END
    $$;
  `;

  try {
    await pool.query(query);
    console.log('✓ Migration: assigned_vehicle_id column ensured in users table');
    return true;
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

module.exports = { addAssignedVehicleIdColumn };
