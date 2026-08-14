-- Şirketlerin banka hesapları ve kasaları (Office PnL için).
--
-- office_payee_banks düz bir liste olduğundan (şirket sütunu yok), aynı bankanın
-- farklı şirketlerdeki hesapları karışmasın diye isimlere şirket öneki eklenir.
-- name benzersiz (056); tekrar çalıştırınca çoğalmaz.

INSERT INTO office_payee_banks (name, is_system) VALUES
  ('Fidelity Denizcilik — İş Bankası TL', false),
  ('Fidelity Denizcilik — İş Bankası USD 1', false),
  ('Fidelity Denizcilik — İş Bankası USD 2', false),
  ('Fidelity Denizcilik — İş Bankası USD 3', false),
  ('Fidelity Denizcilik — İş Bankası GBP', false),
  ('Fidelity Denizcilik — Ziraat Bankası TL', false),
  ('Fidelity Denizcilik — Ziraat Bankası USD', false),
  ('Fidelity Tanker — İş Bankası TL', false),
  ('Fidelity Tanker — İş Bankası USD', false),
  ('Pier Marine — İş Bankası TL', false),
  ('Pier Marine — İş Bankası USD', false),
  ('Vov Denizcilik — İş Bankası TL', false),
  ('WP Maritime — Emirates NBD 001', false),
  ('Company Safe (Kasa)', false),
  ('Finance Group Safe (Kasa)', false)
ON CONFLICT (name) DO NOTHING;
