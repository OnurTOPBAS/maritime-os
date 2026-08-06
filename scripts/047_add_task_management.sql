-- Task Management System
-- Creates tables for task assignment, tracking, and collaboration

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'maintenance', 'inspection', 'documentation', 'compliance',
    'crew_management', 'certificate_renewal', 'port_operations',
    'cargo_operations', 'safety', 'other'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')) DEFAULT 'todo',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ship_id UUID REFERENCES ships(id) ON DELETE SET NULL,
  start_date TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task comments for collaboration
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task activity log
CREATE TABLE IF NOT EXISTS task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task watchers (users following a task)
CREATE TABLE IF NOT EXISTS task_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_ship ON tasks(ship_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_watchers_task ON task_watchers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_watchers_user ON task_watchers(user_id);

-- Trigger to create notification when task is assigned
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.assigned_to,
      'task_assigned',
      'Yeni Görev Atandı',
      'Size yeni bir görev atandı: ' || NEW.title,
      '/dashboard/tasks/' || NEW.id,
      jsonb_build_object(
        'taskId', NEW.id,
        'taskTitle', NEW.title,
        'assignedBy', NEW.assigned_by,
        'priority', NEW.priority,
        'dueDate', NEW.due_date
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON tasks;
CREATE TRIGGER trigger_notify_task_assignment
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_assignment();

-- Trigger to create notification when task status changes
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    -- Notify the person who assigned the task
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.assigned_by,
      'task_status_changed',
      'Görev Durumu Değişti',
      NEW.title || ' görevi durumu: ' || NEW.status,
      '/dashboard/tasks/' || NEW.id,
      jsonb_build_object(
        'taskId', NEW.id,
        'taskTitle', NEW.title,
        'oldStatus', OLD.status,
        'newStatus', NEW.status
      )
    );
    
    -- Notify all watchers
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT 
      user_id,
      'task_status_changed',
      'Görev Durumu Değişti',
      NEW.title || ' görevi durumu: ' || NEW.status,
      '/dashboard/tasks/' || NEW.id,
      jsonb_build_object(
        'taskId', NEW.id,
        'taskTitle', NEW.title,
        'oldStatus', OLD.status,
        'newStatus', NEW.status
      )
    FROM task_watchers
    WHERE task_id = NEW.id AND user_id != NEW.assigned_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_status_change ON tasks;
CREATE TRIGGER trigger_notify_task_status_change
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_status_change();

-- Trigger to create notification when comment is added
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
BEGIN
  SELECT * INTO task_record FROM tasks WHERE id = NEW.task_id;
  
  -- Notify assigned user if they didn't make the comment
  IF task_record.assigned_to IS NOT NULL AND task_record.assigned_to != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      task_record.assigned_to,
      'task_comment',
      'Yeni Görev Yorumu',
      task_record.title || ' görevine yeni yorum eklendi',
      '/dashboard/tasks/' || NEW.task_id,
      jsonb_build_object(
        'taskId', NEW.task_id,
        'taskTitle', task_record.title,
        'commentId', NEW.id
      )
    );
  END IF;
  
  -- Notify task creator if they didn't make the comment
  IF task_record.assigned_by != NEW.user_id AND task_record.assigned_by != task_record.assigned_to THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      task_record.assigned_by,
      'task_comment',
      'Yeni Görev Yorumu',
      task_record.title || ' görevine yeni yorum eklendi',
      '/dashboard/tasks/' || NEW.task_id,
      jsonb_build_object(
        'taskId', NEW.task_id,
        'taskTitle', task_record.title,
        'commentId', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_comment ON task_comments;
CREATE TRIGGER trigger_notify_task_comment
AFTER INSERT ON task_comments
FOR EACH ROW
EXECUTE FUNCTION notify_task_comment();
