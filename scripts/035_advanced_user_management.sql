-- Advanced User Management System
-- Roles, Permissions, Departments

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments without company_id for system-wide departments
INSERT INTO departments (name, description) VALUES
  ('Operasyon', 'Gemi operasyonları ve sefer yönetimi'),
  ('Finans', 'Muhasebe ve finansal işlemler'),
  ('Teknik', 'Gemi bakım ve teknik işlemler'),
  ('Ticaret', 'Navlun ve charter işlemleri'),
  ('Yönetim', 'Üst düzey yönetim')
ON CONFLICT DO NOTHING;

-- Custom roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system roles
INSERT INTO roles (name, description, is_system) VALUES
  ('Admin', 'Tam yetki - tüm modüllere erişim', true),
  ('Manager', 'Yönetici - çoğu modüle erişim', true),
  ('Viewer', 'Görüntüleyici - sadece okuma yetkisi', true),
  ('Operations Manager', 'Operasyon yöneticisi', false),
  ('Finance Manager', 'Finans yöneticisi', false),
  ('Technical Manager', 'Teknik yönetici', false)
ON CONFLICT DO NOTHING;

-- Permissions table (granular permissions)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  UNIQUE(module, action)
);

-- Insert default permissions
INSERT INTO permissions (module, action, description) VALUES
  ('ships', 'view', 'Gemileri görüntüleme'),
  ('ships', 'create', 'Yeni gemi ekleme'),
  ('ships', 'edit', 'Gemi bilgilerini düzenleme'),
  ('ships', 'delete', 'Gemi silme'),
  ('fixtures', 'view', 'Fixture görüntüleme'),
  ('fixtures', 'create', 'Yeni fixture oluşturma'),
  ('fixtures', 'edit', 'Fixture düzenleme'),
  ('fixtures', 'delete', 'Fixture silme'),
  ('voyages', 'view', 'Sefer görüntüleme'),
  ('voyages', 'create', 'Yeni sefer oluşturma'),
  ('voyages', 'edit', 'Sefer düzenleme'),
  ('voyages', 'delete', 'Sefer silme'),
  ('reports', 'view', 'Raporları görüntüleme'),
  ('reports', 'export', 'Rapor dışa aktarma'),
  ('users', 'view', 'Kullanıcıları görüntüleme'),
  ('users', 'create', 'Yeni kullanıcı ekleme'),
  ('users', 'edit', 'Kullanıcı düzenleme'),
  ('users', 'delete', 'Kullanıcı silme'),
  ('settings', 'view', 'Ayarları görüntüleme'),
  ('settings', 'edit', 'Ayarları düzenleme')
ON CONFLICT DO NOTHING;

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Add department and role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
