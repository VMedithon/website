DELETE FROM certificates WHERE certificate_id = 'VMT26-R-0001';
DELETE FROM certificate_templates WHERE id = 'tmpl_1';
DELETE FROM staff_members WHERE id = 'staff_1';
DELETE FROM users WHERE id IN ('staff_1', 'user_1');

INSERT INTO users (id, email, full_name, created_at, updated_at) VALUES
	('staff_1', 'staff@example.com', 'Staff User', datetime('now'), datetime('now')),
	('user_1', 'alice@example.com', 'Alice', datetime('now'), datetime('now'));

INSERT INTO staff_members (id, user_id, role, permissions, status, created_at, activated_at) VALUES
	('staff_1', 'staff_1', 'master_admin', '[]', 'active', datetime('now'), datetime('now'));

INSERT INTO certificate_templates (id, name, track, kind, id_prefix, name_field, status, created_by, created_at) VALUES
	('tmpl_1', 'Test Template', 'RESEARCH', 'participant', 'VMT26-R-', 'full_name', 'published', 'staff_1', datetime('now'));

INSERT INTO certificates (id, certificate_id, template_id, recipient_name, user_id, track, status, issued_at, created_at) VALUES
	('cert_1', 'VMT26-R-0001', 'tmpl_1', 'Alice', 'user_1', 'RESEARCH', 'issued', datetime('now'), datetime('now'));
