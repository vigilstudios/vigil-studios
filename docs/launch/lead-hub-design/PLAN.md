# Lead Hub design alignment

Base: verified production revision 26e7410, isolated from the shared dirty checkout. Match Content Hub's existing tokens, compact header, tab treatment, search toolbar and table. Provide an honest empty inbox, unread view, separate notification/booking preferences, and a readable inquiry-detail/activity layout. Keep the current server actions, tenant scoping, CAPTCHA, notification delivery and launch gates. No customer messages, test leads in production, schema changes or site activation.

Validate filter/query behavior and context-preserving navigation, existing contact tests, type checking/lint/build, and browser checks for empty/populated/settings/detail states at phone and desktop sizes in both themes. Any fixture view must be local-only and clearly marked as sample data; it must not bypass authentication on the real dashboard routes.
