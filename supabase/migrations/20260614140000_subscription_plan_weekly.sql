-- The app now sells a weekly plan alongside monthly/yearly (the billing work
-- added a RevenueCat WEEKLY package and a "weekly" SubscriptionPlan). The
-- subscription_plan enum predates that, so choosing weekly via
-- choose_subscription_plan — or syncing a weekly purchase through the
-- revenuecat-webhook — would fail with "invalid input value for enum
-- subscription_plan: weekly". Add the missing value so weekly is a first-class
-- plan end-to-end.
alter type public.subscription_plan add value if not exists 'weekly';
