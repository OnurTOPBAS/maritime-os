# 031_voyage_calculator.sql — KULLANIM DIŞI

Bu script `voyage_calculations` tablosunu `company_id` temelli bir şemayla
tanımlıyordu. Ancak uygulamanın kullandığı şema `032_voyage_calculator_simple.sql`
tarafından `user_id` temelli olarak oluşturulur; 033 ve 034 de onu genişletir.

İki script aynı tabloyu farklı tasarımla oluşturmaya çalıştığı için 031 her
zaman hata veriyordu. Karışıklığı önlemek adına `.superseded` uzantısıyla
devre dışı bırakıldı. Geçmişe referans olarak dosya korunuyor.
