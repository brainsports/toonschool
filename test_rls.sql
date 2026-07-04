-- Test RLS as orgadmin
BEGIN;
set local role authenticated;
set local request.jwt.claim.sub = 'ad231017-e3b2-4eb9-a2f8-426afe8cc15b'; -- orgadmin id
set local request.jwt.claim.role = 'authenticated';
SELECT id, role, email FROM profiles WHERE organization_id = 'cf1eada8-962d-44f5-b440-6eeb15ba85f6';

-- Test RLS as middleadmin
set local request.jwt.claim.sub = '81356abc-b5a9-46c9-9b6e-aaf7690ee49b'; -- middleadmin id
SELECT id, role, email FROM profiles WHERE organization_id = 'cf1eada8-962d-44f5-b440-6eeb15ba85f6';
COMMIT;
