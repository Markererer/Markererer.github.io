const MBB_SHIFT_CALENDAR_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/mbb-shift-calendar/jllfmahlaoonlcedbpffpkmaobgbnpmd';

document.querySelectorAll('[data-extension-link]').forEach((link) => {
  link.href = MBB_SHIFT_CALENDAR_WEB_STORE_URL;
});