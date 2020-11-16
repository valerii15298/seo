auth
http://34.122.183.77:8080/generateUrlToAuth?customtoken=valerii15298
curl 'https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/reviews' -H "Authorization: OAuth "

Setup is complete. System reboot is recommended.
The locations need to be configured manually in /var/www/webpagetest/www/settings/locations.ini
The settings can be tweaked in /var/www/webpagetest/www/settings/settings.ini

The location key to use when configuring agents is: SXpskecJZqv1r2DJt3vrsJAQvh1uR8TH
An API key to use for automated testing is: Id8TtTyAKdcmNZtHzuOS6ABJV5gaxAFE

[locations]
1=Test_loc
default=Test_loc

; These are the top-level locations that are listed in the location dropdown
; Each one points to one or more browser configurations

[Test_loc]
1=Test
label=Test Location

; Tese are the browser-specific configurations that match the configurations
; defined in the top-level locations.  Each one of these MUST match the location
; name configured on the test agent (urlblast.ini or wptdriver.ini)

[Test]
browser=Chrome,Firefox
label="Test Location"

