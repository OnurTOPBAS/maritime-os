-- Update dashboard preferences to support layout templates
ALTER TABLE dashboard_preferences 
ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'grid-2col',
ADD COLUMN IF NOT EXISTS widget_positions JSONB DEFAULT '{}'::jsonb;

-- layout_type options: 'grid-2col', 'grid-3col', 'sidebar-left', 'sidebar-right', 'masonry'
-- widget_positions: { "widgetId": { "area": "main|sidebar|top", "order": 0 } }
