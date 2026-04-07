-- Template de captura "The New Chance" (roleta + cupom).
ALTER TABLE public.capture_sites
  DROP CONSTRAINT IF EXISTS capture_sites_page_template_check;

ALTER TABLE public.capture_sites
  ADD CONSTRAINT capture_sites_page_template_check
  CHECK (page_template IN ('classic', 'vip_rosa', 'vip_terroso', 'vinho_rose', 'the_new_chance'));
