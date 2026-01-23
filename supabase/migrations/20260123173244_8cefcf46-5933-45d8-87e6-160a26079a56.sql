-- Create audit_logs table for tracking role assignments and staff changes
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only users with staff.manage permission can read audit logs
CREATE POLICY "Users with staff.manage can read audit_logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (has_permission(auth.uid(), 'staff.manage'));

-- Allow insert for audit logging (system operation)
CREATE POLICY "Authenticated users can insert audit_logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Add password_reset_required to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT false;

-- Function to log audit entries
CREATE OR REPLACE FUNCTION public.log_audit(
  _action TEXT,
  _entity_type TEXT,
  _entity_id UUID,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, old_values, new_values, metadata)
  VALUES (_action, _entity_type, _entity_id, auth.uid(), _old_values, _new_values, _metadata)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;